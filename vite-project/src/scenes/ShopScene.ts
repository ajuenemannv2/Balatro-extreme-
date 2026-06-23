import Phaser from 'phaser';
import type { RunState } from '../types/Run.ts';
import type { ShopState, ShopItem, PackType } from '../types/Shop.ts';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, CARD_W, CARD_H, FONT, DEPTH } from '../config.ts';
import { Button } from '../ui/Button.ts';
import { JokerView } from '../ui/JokerView.ts';
import { ScorePopup } from '../ui/ScorePopup.ts';
import { TextureCache } from '../rendering/TextureCache.ts';
import { generateShop, rerollShop, generatePackContents } from '../engine/ShopGenerator.ts';
import { canAfford, buyItem, sellJoker, sellConsumable } from '../engine/EconomyEngine.ts';
import { addJokerToRun, getRNG } from '../engine/RunManager.ts';
import { saveRun } from '../engine/SaveSystem.ts';
import { drawJokerFace } from '../rendering/JokerRenderer.ts';
import { drawTarotFace, drawPlanetFace, drawSpectralFace } from '../rendering/ConsumableRenderer.ts';
import { drawCardFace, drawCardBack } from '../rendering/CardRenderer.ts';
import { VOUCHER_DEFS } from '../data/VoucherDefs.ts';
import type { RNG } from '../engine/RNG.ts';
import type { TarotDefinition, PlanetDefinition, SpectralDefinition } from '../types/Consumable.ts';
import type { JokerDefinition } from '../types/Joker.ts';
import type { Rank, Suit } from '../types/Card.ts';
import { makeCard, shuffleDeck } from '../engine/DeckBuilder.ts';

type PackContent =
  | { kind: 'tarot'; def: TarotDefinition }
  | { kind: 'planet'; def: PlanetDefinition }
  | { kind: 'spectral'; def: SpectralDefinition }
  | { kind: 'joker'; def: JokerDefinition }
  | { kind: 'standard'; rank: Rank; suit: Suit };

const PACK_PICKS: Record<PackType, number> = {
  arcana: 1, mega_arcana: 2,
  celestial: 1, mega_celestial: 2,
  spectral: 1,
  buffoon: 1, mega_buffoon: 2,
  standard: 1, mega_standard: 2,
};

const CARD_BACK_KEY = 'card_back_global';

export class ShopScene extends Phaser.Scene {
  private runState!: RunState;
  private shopState!: ShopState;
  private rng!: RNG;
  private textureCache!: TextureCache;

  // Dynamic UI elements
  private moneyText!: Phaser.GameObjects.Text;
  private rerollBtn!: Button;
  private jokerViews: JokerView[] = [];
  private itemContainers: Phaser.GameObjects.Container[] = [];
  private voucherContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data?: { runState?: RunState }): void {
    if (data?.runState) {
      this.runState = data.runState;
    }
  }

  create(): void {
    const rs = this.runState;
    if (!rs) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No run state!', {
        fontFamily: FONT, fontSize: '24px', color: '#ff0000',
      }).setOrigin(0.5);
      return;
    }

    this.textureCache = new TextureCache(this, 256);
    this.rng = getRNG(rs);
    this.shopState = generateShop(rs, this.rng);
    rs.rngState = this.rng.getState();

    this.cameras.main.setBackgroundColor(COLORS.bgHex);

    this._drawBackground();
    this._buildHeader();
    this._buildShopItems();
    this._buildVoucherSlot();
    this._buildJokerRow();
    this._buildBottomBar();
  }

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  private _drawBackground(): void {
    // Main shop panel
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 0.8);
    panel.fillRoundedRect(40, 80, GAME_WIDTH - 80, 430, 12);
    panel.setDepth(DEPTH.bg + 1);

    // Joker row panel
    const jPanel = this.add.graphics();
    jPanel.fillStyle(COLORS.panelDark, 0.8);
    jPanel.fillRoundedRect(40, 525, GAME_WIDTH - 80, 130, 10);
    jPanel.setDepth(DEPTH.bg + 1);
  }

  // ---------------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------------

  private _buildHeader(): void {
    const rs = this.runState;

    // Top bar
    const topBar = this.add.graphics();
    topBar.fillStyle(COLORS.panelDark, 0.9);
    topBar.fillRect(0, 0, GAME_WIDTH, 76);
    topBar.setDepth(DEPTH.hud - 5);

    this.add.text(GAME_WIDTH / 2, 24, 'Shop', {
      fontFamily: FONT, fontSize: '32px', color: COLORS.goldHex,
    }).setOrigin(0.5).setDepth(DEPTH.hud);

    this.add.text(GAME_WIDTH / 2, 54, `Ante ${rs.ante} / 8  —  Round over`, {
      fontFamily: FONT, fontSize: '14px', color: '#888888',
    }).setOrigin(0.5).setDepth(DEPTH.hud);

    this.moneyText = this.add.text(GAME_WIDTH - 30, 36, `$${rs.money}`, {
      fontFamily: FONT, fontSize: '28px', color: COLORS.goldHex,
    }).setOrigin(1, 0.5).setDepth(DEPTH.hud);

    // Section label
    this.add.text(GAME_WIDTH / 2, 92, 'For Sale', {
      fontFamily: FONT, fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(DEPTH.ui);
  }

  // ---------------------------------------------------------------------------
  // Shop Items
  // ---------------------------------------------------------------------------

  private _buildShopItems(): void {
    this.itemContainers.forEach(c => c.destroy());
    this.itemContainers = [];

    const items = this.shopState.items;
    const count = items.length;
    const slotW = 220;
    const slotH = 280;
    const spacing = 20;
    const totalW = count * slotW + (count - 1) * spacing;
    const startX = GAME_WIDTH / 2 - totalW / 2;
    const slotY = 115;

    items.forEach((item, i) => {
      const x = startX + i * (slotW + spacing);
      const container = this._buildItemSlot(item, x, slotY, slotW, slotH);
      this.itemContainers.push(container);
    });

    // Reroll button
    if (this.rerollBtn) this.rerollBtn.destroy();
    const rerollCost = this.shopState.rerollCost;
    const freeRerolls = this.runState.freeRerollsPerShop - this.shopState.rerollsUsed;
    const rerollLabel = freeRerolls > 0 ? `Reroll (Free ×${freeRerolls})` : `Reroll $${rerollCost}`;

    this.rerollBtn = new Button(this, GAME_WIDTH / 2, slotY + slotH + 30, 180, 44, rerollLabel, () => {
      this._doReroll();
    }, { color: COLORS.btnPurple });
    this.rerollBtn.setDepth(DEPTH.ui);
  }

  private _buildItemSlot(item: ShopItem, x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(DEPTH.cards);

    // Slot background
    const bg = this.add.graphics();
    if (item.sold) {
      bg.fillStyle(0x111111, 0.8);
      bg.lineStyle(1, 0x333333, 1);
    } else {
      bg.fillStyle(COLORS.panelDark, 1);
      bg.lineStyle(1, 0x4a3060, 0.8);
    }
    bg.fillRoundedRect(0, 0, w, h, 8);
    bg.strokeRoundedRect(0, 0, w, h, 8);
    container.add(bg);

    if (item.sold) {
      const soldText = this.add.text(w / 2, h / 2, 'SOLD', {
        fontFamily: FONT, fontSize: '22px', color: '#555555',
      }).setOrigin(0.5);
      container.add(soldText);
      return container;
    }

    // Item artwork
    const artX = w / 2;
    const artY = 60 + CARD_H / 2;
    const texKey = this._getItemTexKey(item);

    if (texKey) {
      const img = this.add.image(artX, artY, texKey);
      container.add(img);
    }

    // Item name
    let name = 'Unknown';
    let typeLabel = String(item.type);

    if (item.type === 'joker' && item.jokerDef) {
      name = item.jokerDef.name;
      typeLabel = `${item.jokerDef.rarity} Joker`;
    } else if (item.type === 'tarot' && item.tarotDef) {
      name = item.tarotDef.name;
      typeLabel = 'Tarot';
    } else if (item.type === 'planet' && item.planetDef) {
      name = item.planetDef.name;
      typeLabel = 'Planet';
    } else if (item.type === 'spectral' && item.spectralDef) {
      name = item.spectralDef.name;
      typeLabel = 'Spectral';
    } else if (item.type === 'pack') {
      name = (item.packType ?? 'Pack').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      typeLabel = 'Booster Pack';
    } else if (item.type === 'voucher' && item.voucherId) {
      const vDef = VOUCHER_DEFS.find(v => v.id === item.voucherId);
      name = vDef?.name ?? item.voucherId;
      typeLabel = 'Voucher';
    }

    const typeLabelColors: Record<string, string> = {
      'Common Joker': '#888888',
      'Uncommon Joker': '#4488ff',
      'Rare Joker': '#ff4444',
      'Legendary Joker': '#ffaa00',
      Tarot: '#c9a227',
      Planet: '#88ccff',
      Spectral: '#88ccdd',
      Voucher: '#cc88ff',
      'Booster Pack': '#ffcc44',
    };

    const typeLabelText = this.add.text(artX, artY - CARD_H / 2 - 20, typeLabel, {
      fontFamily: FONT, fontSize: '11px',
      color: typeLabelColors[typeLabel] ?? '#aaaaaa',
    }).setOrigin(0.5);
    container.add(typeLabelText);

    const nameText = this.add.text(artX, artY + CARD_H / 2 + 10, name, {
      fontFamily: FONT, fontSize: '13px', color: '#ffffff',
      wordWrap: { width: w - 10 }, align: 'center',
    }).setOrigin(0.5, 0);
    container.add(nameText);

    // Description (small)
    let desc = '';
    if (item.type === 'joker' && item.jokerDef) desc = item.jokerDef.description;
    else if (item.type === 'tarot' && item.tarotDef) desc = item.tarotDef.description;
    else if (item.type === 'planet' && item.planetDef) desc = item.planetDef.description;
    else if (item.type === 'spectral' && item.spectralDef) desc = item.spectralDef.description;
    else if (item.type === 'voucher' && item.voucherId) {
      const vDef = VOUCHER_DEFS.find(v => v.id === item.voucherId);
      desc = vDef?.description ?? '';
    }

    if (desc) {
      const descText = this.add.text(artX, artY + CARD_H / 2 + 30, desc, {
        fontFamily: FONT, fontSize: '10px', color: '#aaaaaa',
        wordWrap: { width: w - 16 }, align: 'center',
      }).setOrigin(0.5, 0);
      container.add(descText);
    }

    // Buy button (placed at absolute scene coordinates, not inside container)
    const canBuy = canAfford(this.runState, item.cost);
    const buyBtn = new Button(
      this,
      x + w / 2,
      y + h - 26,
      130,
      36,
      `Buy $${item.cost}`,
      () => this._buyItem(item, container),
      { color: canBuy ? COLORS.green : 0x555555, fontSize: 14 }
    );
    buyBtn.setEnabled(canBuy);
    buyBtn.setDepth(DEPTH.ui);

    return container;
  }

  private _getItemTexKey(item: ShopItem): string | null {
    if (item.type === 'joker' && item.jokerDef) {
      const key = `shop_joker_${item.jokerDef.id}_${item.jokerEdition ?? 'base'}`;
      this.textureCache.getOrCreate(key, CARD_W, CARD_H, (canvas) => {
        drawJokerFace(canvas, item.jokerDef!.id, item.jokerDef!.name, item.jokerDef!.rarity);
      });
      return key;
    }
    if (item.type === 'tarot' && item.tarotDef) {
      const key = `shop_tarot_${item.tarotDef.id}`;
      this.textureCache.getOrCreate(key, CARD_W, CARD_H, (canvas) => {
        drawTarotFace(canvas, item.tarotDef!.id, item.tarotDef!.name);
      });
      return key;
    }
    if (item.type === 'planet' && item.planetDef) {
      const key = `shop_planet_${item.planetDef.id}`;
      this.textureCache.getOrCreate(key, CARD_W, CARD_H, (canvas) => {
        drawPlanetFace(canvas, item.planetDef!.id, item.planetDef!.name);
      });
      return key;
    }
    if (item.type === 'spectral' && item.spectralDef) {
      const key = `shop_spectral_${item.spectralDef.id}`;
      this.textureCache.getOrCreate(key, CARD_W, CARD_H, (canvas) => {
        drawSpectralFace(canvas, item.spectralDef!.id, item.spectralDef!.name);
      });
      return key;
    }
    return null;
  }

  private _buyItem(item: ShopItem, _container: Phaser.GameObjects.Container): void {
    const rs = this.runState;

    if (!canAfford(rs, item.cost)) {
      ScorePopup.spawn(this, GAME_WIDTH / 2, 300, "Can't afford!", '#ff8888');
      return;
    }

    buyItem(rs, item.cost);
    item.sold = true;
    this.moneyText.setText(`$${rs.money}`);

    if (item.type === 'joker' && item.jokerDef) {
      const added = addJokerToRun(rs, item.jokerDef.id, item.jokerEdition ?? 'base');
      if (!added) {
        // Joker slots full, refund
        rs.money += item.cost;
        this.moneyText.setText(`$${rs.money}`);
        ScorePopup.spawn(this, GAME_WIDTH / 2, 300, 'Joker slots full!', '#ff8888');
        item.sold = false;
        return;
      }
      ScorePopup.spawn(this, GAME_WIDTH / 2, 300, `Got ${item.jokerDef.name}!`, COLORS.goldHex);
      this._buildJokerRow();
    } else if (item.type === 'tarot' && item.tarotDef) {
      if (rs.consumables.length >= rs.maxConsumableSlots) {
        rs.money += item.cost;
        this.moneyText.setText(`$${rs.money}`);
        ScorePopup.spawn(this, GAME_WIDTH / 2, 300, 'Consumable slots full!', '#ff8888');
        item.sold = false;
        return;
      }
      rs.consumables.push({
        instanceId: `tarot_${item.tarotDef.id}_${Date.now()}`,
        type: 'tarot',
        defId: item.tarotDef.id,
      });
      ScorePopup.spawn(this, GAME_WIDTH / 2, 300, `Got ${item.tarotDef.name}!`, '#c9a227');
    } else if (item.type === 'planet' && item.planetDef) {
      if (rs.consumables.length >= rs.maxConsumableSlots) {
        rs.money += item.cost;
        this.moneyText.setText(`$${rs.money}`);
        ScorePopup.spawn(this, GAME_WIDTH / 2, 300, 'Consumable slots full!', '#ff8888');
        item.sold = false;
        return;
      }
      rs.consumables.push({
        instanceId: `planet_${item.planetDef.id}_${Date.now()}`,
        type: 'planet',
        defId: item.planetDef.id,
      });
      ScorePopup.spawn(this, GAME_WIDTH / 2, 300, `Got ${item.planetDef.name}!`, '#88ccff');
    } else if (item.type === 'spectral' && item.spectralDef) {
      if (rs.consumables.length >= rs.maxConsumableSlots) {
        rs.money += item.cost;
        this.moneyText.setText(`$${rs.money}`);
        ScorePopup.spawn(this, GAME_WIDTH / 2, 300, 'Consumable slots full!', '#ff8888');
        item.sold = false;
        return;
      }
      rs.consumables.push({
        instanceId: `spectral_${item.spectralDef.id}_${Date.now()}`,
        type: 'spectral',
        defId: item.spectralDef.id,
      });
      ScorePopup.spawn(this, GAME_WIDTH / 2, 300, `Got ${item.spectralDef.name}!`, '#88ccdd');
    } else if (item.type === 'voucher' && item.voucherId) {
      const vDef = VOUCHER_DEFS.find(v => v.id === item.voucherId);
      if (vDef) {
        rs.vouchers.push(item.voucherId);
        vDef.effect?.(rs);
        ScorePopup.spawn(this, GAME_WIDTH / 2, 300, `Got ${vDef.name}!`, '#cc88ff');
      }
    } else if (item.type === 'pack' && item.packType) {
      const rng = getRNG(rs);
      const raw = generatePackContents(item.packType, rs, rng);
      rs.rngState = rng.getState();
      const contents = this._parsePackContents(item.packType, raw);
      this._openPackOverlay(item.packType, contents);
      saveRun(rs);
      this._buildShopItems();
      return;
    }

    saveRun(rs);
    this._buildShopItems();
  }

  // ---------------------------------------------------------------------------
  // Pack helpers
  // ---------------------------------------------------------------------------

  private _parsePackContents(packType: PackType, raw: unknown[]): PackContent[] {
    switch (packType) {
      case 'arcana':
      case 'mega_arcana':
        return (raw as TarotDefinition[]).map(def => ({ kind: 'tarot' as const, def }));
      case 'celestial':
      case 'mega_celestial':
        return (raw as PlanetDefinition[]).map(def => ({ kind: 'planet' as const, def }));
      case 'spectral':
        return (raw as SpectralDefinition[]).map(def => ({ kind: 'spectral' as const, def }));
      case 'buffoon':
      case 'mega_buffoon':
        return (raw as JokerDefinition[]).filter(Boolean).map(def => ({ kind: 'joker' as const, def }));
      case 'standard':
      case 'mega_standard':
        return (raw as { rank: Rank; suit: Suit }[]).map(({ rank, suit }) => ({ kind: 'standard' as const, rank, suit }));
    }
  }

  private _buildPackTexKey(content: PackContent): string {
    switch (content.kind) {
      case 'tarot': {
        const key = `pack_tarot_${content.def.id}`;
        this.textureCache.getOrCreate(key, CARD_W, CARD_H, c => drawTarotFace(c, content.def.id, content.def.name));
        return key;
      }
      case 'planet': {
        const key = `pack_planet_${content.def.id}`;
        this.textureCache.getOrCreate(key, CARD_W, CARD_H, c => drawPlanetFace(c, content.def.id, content.def.name));
        return key;
      }
      case 'spectral': {
        const key = `pack_spectral_${content.def.id}`;
        this.textureCache.getOrCreate(key, CARD_W, CARD_H, c => drawSpectralFace(c, content.def.id, content.def.name));
        return key;
      }
      case 'joker': {
        const key = `pack_joker_${content.def.id}`;
        this.textureCache.getOrCreate(key, CARD_W, CARD_H, c => drawJokerFace(c, content.def.id, content.def.name, content.def.rarity));
        return key;
      }
      case 'standard': {
        const key = `pack_std_${content.rank}_${content.suit}`;
        this.textureCache.getOrCreate(key, CARD_W, CARD_H, c => drawCardFace(c, content.rank, content.suit, 'none', false, false));
        return key;
      }
    }
  }

  private _applyPackPick(content: PackContent): void {
    const rs = this.runState;
    switch (content.kind) {
      case 'tarot':
      case 'planet':
      case 'spectral': {
        if (rs.consumables.length >= rs.maxConsumableSlots) {
          ScorePopup.spawn(this, GAME_WIDTH / 2, 300, 'Consumable slots full!', '#ff8888');
          return;
        }
        rs.consumables.push({
          instanceId: `${content.kind}_${content.def.id}_${Date.now()}`,
          type: content.kind,
          defId: content.def.id,
        });
        ScorePopup.spawn(this, GAME_WIDTH / 2, 300, `Got ${content.def.name}!`, COLORS.goldHex);
        break;
      }
      case 'joker': {
        const added = addJokerToRun(rs, content.def.id, 'base');
        if (!added) {
          ScorePopup.spawn(this, GAME_WIDTH / 2, 300, 'Joker slots full!', '#ff8888');
        } else {
          ScorePopup.spawn(this, GAME_WIDTH / 2, 300, `Got ${content.def.name}!`, COLORS.goldHex);
          this._buildJokerRow();
        }
        break;
      }
      case 'standard': {
        const card = makeCard(content.rank, content.suit);
        rs.deck.push(card);
        rs.deck = shuffleDeck(rs.deck, this.rng);
        ScorePopup.spawn(this, GAME_WIDTH / 2, 300, `Added ${content.rank}${content.suit[0]}!`, COLORS.goldHex);
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Pack opening overlay
  // ---------------------------------------------------------------------------

  private _openPackOverlay(packType: PackType, contents: PackContent[]): void {
    const maxPicks = PACK_PICKS[packType] ?? 1;
    const takeAll = maxPicks >= contents.length;

    // Pre-build card back texture
    this.textureCache.getOrCreate(CARD_BACK_KEY, CARD_W, CARD_H, c => drawCardBack(c));

    // All objects tracked for cleanup
    const overlayObjs: Phaser.GameObjects.GameObject[] = [];

    const closeOverlay = () => {
      this.tweens.add({
        targets: scrim, fillAlpha: 0, duration: 200,
        onComplete: () => overlayObjs.forEach(o => { try { o.destroy(); } catch { /* already destroyed */ } }),
      });
    };

    // Scrim — intercepts pointer events
    const scrim = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0,
    ).setInteractive().setDepth(198);
    overlayObjs.push(scrim);
    this.tweens.add({ targets: scrim, fillAlpha: 0.75, duration: 240 });

    // Panel
    const panelW = Math.max(420, Math.min(contents.length * 112 + 100, 920));
    const panelH = 390;
    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const panel = this.add.graphics().setDepth(199);
    panel.fillStyle(COLORS.panelDark, 0.97);
    panel.lineStyle(2, COLORS.gold, 0.85);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 14);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 14);
    overlayObjs.push(panel);

    // Pack title
    const packName = packType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    overlayObjs.push(
      this.add.text(GAME_WIDTH / 2, panelY + 28, packName, {
        fontFamily: FONT, fontSize: '26px', color: COLORS.goldHex,
      }).setOrigin(0.5).setDepth(200),
    );

    const chooseLabel = takeAll ? `Take all ${contents.length}` : `Choose ${maxPicks} of ${contents.length}`;
    overlayObjs.push(
      this.add.text(GAME_WIDTH / 2, panelY + 60, chooseLabel, {
        fontFamily: FONT, fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(200),
    );

    // Cards
    const n = contents.length;
    const spacing = n > 1 ? Math.min(110, (panelW - 100) / (n - 1)) : 0;
    const totalW = (n - 1) * spacing;
    const baseX = GAME_WIDTH / 2 - totalW / 2;
    const cardsY = GAME_HEIGHT / 2 + 20;

    const selected = new Set<number>();
    const cardImgs: Phaser.GameObjects.Image[] = [];
    const selGfxArr: Phaser.GameObjects.Graphics[] = [];

    const redrawSelections = () => {
      for (let i = 0; i < n; i++) {
        const g = selGfxArr[i];
        g.clear();
        const cx = baseX + i * spacing;
        if (selected.has(i)) {
          g.lineStyle(3, COLORS.gold, 1);
          g.strokeRoundedRect(cx - CARD_W / 2 - 3, cardsY - CARD_H / 2 - 3, CARD_W + 6, CARD_H + 6, 8);
          g.lineStyle(10, COLORS.gold, 0.22);
          g.strokeRoundedRect(cx - CARD_W / 2 - 8, cardsY - CARD_H / 2 - 8, CARD_W + 16, CARD_H + 16, 12);
          cardImgs[i]?.setScale(1.08);
        } else {
          cardImgs[i]?.setScale(1.0);
        }
      }
      takeBtn.setEnabled(takeAll || selected.size >= maxPicks);
    };

    contents.forEach((content, ci) => {
      const cx = baseX + ci * spacing;

      const selGfx = this.add.graphics().setDepth(200);
      selGfxArr.push(selGfx);
      overlayObjs.push(selGfx);

      const img = this.add.image(cx, cardsY, CARD_BACK_KEY).setAlpha(0).setDepth(201);
      cardImgs.push(img);
      overlayObjs.push(img);

      // Appear face-down
      const appearDelay = 280 + ci * 130;
      this.tweens.add({ targets: img, alpha: 1, duration: 140, delay: appearDelay });

      // Flip face-up
      this.time.delayedCall(appearDelay + 180, () => {
        this.tweens.add({
          targets: img, scaleX: 0, duration: 110, ease: 'Quad.In',
          onComplete: () => {
            img.setTexture(this._buildPackTexKey(content));
            img.setInteractive({ useHandCursor: true });
            this.tweens.add({ targets: img, scaleX: 1, duration: 110, ease: 'Quad.Out' });

            if (!takeAll) {
              img.on('pointerdown', () => {
                if (selected.has(ci)) {
                  selected.delete(ci);
                } else if (selected.size < maxPicks) {
                  selected.add(ci);
                }
                redrawSelections();
              });
            }
            img.on('pointerover', () => { if (!selected.has(ci)) img.setScale(1.05); });
            img.on('pointerout', () => { if (!selected.has(ci)) img.setScale(1.0); });
          },
        });
      });
    });

    // Take button
    const takeBtn = new Button(
      this, GAME_WIDTH / 2, panelY + panelH - 32,
      160, 42, 'Take',
      () => {
        const picks = takeAll ? contents.map((_, i) => i) : [...selected];
        for (const idx of picks) this._applyPackPick(contents[idx]);
        saveRun(this.runState);
        closeOverlay();
      },
      { color: takeAll ? COLORS.green : 0x555555, fontSize: 16 },
    );
    takeBtn.setEnabled(takeAll);
    takeBtn.setDepth(202);
    overlayObjs.push(takeBtn);
  }

  // ---------------------------------------------------------------------------
  // Voucher Slot
  // ---------------------------------------------------------------------------

  private _buildVoucherSlot(): void {
    if (this.voucherContainer) {
      this.voucherContainer.destroy();
      this.voucherContainer = null;
    }

    const voucher = this.shopState.voucher;
    if (!voucher) return;

    const vx = GAME_WIDTH - 190;
    const vy = 115;
    const vw = 160;
    const vh = 260;

    const container = this.add.container(vx, vy);
    container.setDepth(DEPTH.cards);
    this.voucherContainer = container;

    // Background
    const bg = this.add.graphics();
    if (voucher.sold) {
      bg.fillStyle(0x111111, 0.8);
    } else {
      bg.fillStyle(COLORS.panelDark, 1);
      bg.lineStyle(2, 0xcc88ff, 0.8);
    }
    bg.fillRoundedRect(0, 0, vw, vh, 8);
    bg.strokeRoundedRect(0, 0, vw, vh, 8);
    container.add(bg);

    if (voucher.sold) {
      container.add(this.add.text(vw / 2, vh / 2, 'SOLD', {
        fontFamily: FONT, fontSize: '18px', color: '#555555',
      }).setOrigin(0.5));
      return;
    }

    container.add(this.add.text(vw / 2, 14, 'VOUCHER', {
      fontFamily: FONT, fontSize: '11px', color: '#cc88ff',
    }).setOrigin(0.5));

    if (voucher.voucherId) {
      const vDef = VOUCHER_DEFS.find(v => v.id === voucher.voucherId);
      container.add(this.add.text(vw / 2, 70, vDef?.name ?? 'Voucher', {
        fontFamily: FONT, fontSize: '13px', color: '#ffffff', align: 'center',
        wordWrap: { width: vw - 10 },
      }).setOrigin(0.5));

      container.add(this.add.text(vw / 2, 110, vDef?.description ?? '', {
        fontFamily: FONT, fontSize: '10px', color: '#aaaaaa', align: 'center',
        wordWrap: { width: vw - 10 },
      }).setOrigin(0.5, 0));
    }

    const canBuy = canAfford(this.runState, voucher.cost);
    new Button(
      this,
      vx + vw / 2,
      vy + vh - 26,
      120,
      34,
      `Buy $${voucher.cost}`,
      () => this._buyItem(voucher, container),
      { color: canBuy ? COLORS.green : 0x555555, fontSize: 13 }
    ).setEnabled(canBuy);
  }

  // ---------------------------------------------------------------------------
  // Joker Row (sell area)
  // ---------------------------------------------------------------------------

  private _buildJokerRow(): void {
    this.jokerViews.forEach(jv => jv.destroy());
    this.jokerViews = [];

    const rs = this.runState;
    const rowY = 570;

    this.add.text(80, rowY - 26, `Jokers (${rs.jokers.length}/${rs.maxJokerSlots})  —  Right-click to sell`, {
      fontFamily: FONT, fontSize: '13px', color: '#888888',
    }).setDepth(DEPTH.ui);

    rs.jokers.forEach((joker, i) => {
      const jx = 80 + i * 82;
      const jv = new JokerView(this, jx, rowY + 16, joker, this.textureCache);
      this.jokerViews.push(jv);

      // Right-click / secondary button to sell
      jv.on('pointerup', (ptr: Phaser.Input.Pointer) => {
        if (ptr.rightButtonReleased()) {
          if (joker.isEternal) {
            ScorePopup.spawn(this, GAME_WIDTH / 2, 490, `${joker.name} is Eternal!`, '#ff8888');
            return;
          }
          const value = sellJoker(rs, joker.instanceId);
          if (value > 0) {
            this.moneyText.setText(`$${rs.money}`);
            ScorePopup.spawn(this, jx, rowY - 20, `+$${value}`, COLORS.goldHex);
            saveRun(rs);
            this._buildJokerRow();
          }
        }
      });
    });

    // Sell label hint
    if (rs.jokers.length > 0) {
      this.add.text(80 + rs.jokers.length * 82 + 10, rowY + 16, '← Right-click to sell', {
        fontFamily: FONT, fontSize: '11px', color: '#555555',
      }).setOrigin(0, 0.5).setDepth(DEPTH.ui);
    }

    // Consumable slots
    rs.consumables.forEach((cons, i) => {
      const cx = GAME_WIDTH - 90 - i * 82;
      const slotBg = this.add.graphics();
      slotBg.fillStyle(COLORS.panelDark, 0.8);
      slotBg.fillRoundedRect(cx - CARD_W / 2 - 2, rowY - 2, CARD_W + 4, CARD_H / 2 + 14, 6);
      slotBg.setDepth(DEPTH.table);

      this.add.text(cx, rowY + 20, cons.defId.split('_').pop() ?? cons.defId, {
        fontFamily: FONT, fontSize: '10px', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(DEPTH.ui);

      // Click to sell consumable
      slotBg.setInteractive(
        new Phaser.Geom.Rectangle(cx - CARD_W / 2 - 2, rowY - 2, CARD_W + 4, CARD_H / 2 + 14),
        Phaser.Geom.Rectangle.Contains
      );
      slotBg.on('pointerup', (ptr: Phaser.Input.Pointer) => {
        if (ptr.rightButtonReleased()) {
          const val = sellConsumable(rs, cons.instanceId);
          if (val > 0) {
            this.moneyText.setText(`$${rs.money}`);
            ScorePopup.spawn(this, cx, rowY - 20, `+$${val}`, COLORS.goldHex);
            saveRun(rs);
            this._buildJokerRow();
          }
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Bottom Bar
  // ---------------------------------------------------------------------------

  private _buildBottomBar(): void {
    const rs = this.runState;

    new Button(this, GAME_WIDTH - 120, GAME_HEIGHT - 36, 200, 48, 'Next Round →', () => {
      rs.shopRerollCost = 5;
      rs.freeRerollsPerShop = 0;
      saveRun(rs);
      this.scene.start('BlindSelectScene', { runState: rs });
    }, { color: COLORS.green, fontSize: 18 }).setDepth(DEPTH.ui);

    this.add.text(60, GAME_HEIGHT - 36, `Seed: ${rs.seed}  Ante: ${rs.ante}/8`, {
      fontFamily: FONT, fontSize: '12px', color: '#444444',
    }).setOrigin(0, 0.5).setDepth(DEPTH.ui);
  }

  // ---------------------------------------------------------------------------
  // Reroll
  // ---------------------------------------------------------------------------

  private _doReroll(): void {
    const rs = this.runState;
    const freeRerolls = rs.freeRerollsPerShop - this.shopState.rerollsUsed;

    if (freeRerolls > 0) {
      this.shopState = rerollShop(rs, this.rng, this.shopState);
      rs.rngState = this.rng.getState();
    } else {
      const cost = this.shopState.rerollCost;
      if (!canAfford(rs, cost)) {
        ScorePopup.spawn(this, GAME_WIDTH / 2, 300, "Can't afford reroll!", '#ff8888');
        return;
      }
      buyItem(rs, cost);
      this.moneyText.setText(`$${rs.money}`);
      this.shopState = rerollShop(rs, this.rng, this.shopState);
      rs.rngState = this.rng.getState();
    }

    saveRun(rs);
    this._buildShopItems();
  }

  shutdown(): void {
    this.jokerViews.forEach(jv => jv.destroy());
    this.itemContainers.forEach(c => c.destroy());
    this.voucherContainer?.destroy();
    this.textureCache?.clear();
  }
}
