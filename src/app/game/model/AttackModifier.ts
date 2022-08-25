import { Action } from "./Action";

export enum AttackModifierType {
  plus0 = "plus0",
  plus1 = "plus1",
  plus2 = "plus2",
  plus3 = "plus3",
  plus4 = "plus4",
  minus1 = "minus1",
  minus2 = "minus2",
  null = "null",
  double = "double",
  bless = "bless",
  curse = "curse",
  invalid = "invalid",
}

export enum AttackModifierValueType {
  plus = "plus",
  minus = "minus",
  multiply = "multiply"
}

export class AttackModifier {

  id: string;
  type: AttackModifierType;
  value: number = 0;
  valueType: AttackModifierValueType = AttackModifierValueType.plus;
  shuffle: boolean = false;
  actions: Action[];
  rolling: boolean;
  revealed: boolean = false;
  character: boolean = false;

  constructor(type: AttackModifierType, id: string | undefined = undefined, actions: Action[] = [], rolling: boolean = false) {
    this.type = type;
    this.id = id || type;
    this.actions = actions;
    this.rolling = rolling;
    switch (type) {
      case AttackModifierType.plus0:
        this.value = 0;
        break;
      case AttackModifierType.plus1:
        this.value = 1;
        break;
      case AttackModifierType.plus2:
        this.value = 2;
        break;
      case AttackModifierType.plus3:
        this.value = 3;
        break;
      case AttackModifierType.plus4:
        this.value = 4;
        break;
      case AttackModifierType.minus1:
        this.valueType = AttackModifierValueType.minus;
        this.value = 1;
        break;
      case AttackModifierType.minus2:
        this.valueType = AttackModifierValueType.minus;
        this.value = 2;
        break;
      case AttackModifierType.null:
        this.valueType = AttackModifierValueType.multiply;
        this.value = 0;
        this.shuffle = true;
        break;
      case AttackModifierType.double:
        this.valueType = AttackModifierValueType.multiply;
        this.value = 2;
        this.shuffle = true;
        break;
      case AttackModifierType.bless:
        this.valueType = AttackModifierValueType.multiply;
        this.value = 2;
        break;
      case AttackModifierType.curse:
        this.valueType = AttackModifierValueType.multiply;
        this.value = 0;
        break;
    }
  }
}

export const defaultAttackModifier: AttackModifier[] = [
  new AttackModifier(AttackModifierType.plus0),
  new AttackModifier(AttackModifierType.plus1),
  new AttackModifier(AttackModifierType.minus1),
  new AttackModifier(AttackModifierType.plus2),
  new AttackModifier(AttackModifierType.minus2),
  new AttackModifier(AttackModifierType.double),
  new AttackModifier(AttackModifierType.null),
  new AttackModifier(AttackModifierType.bless),
  new AttackModifier(AttackModifierType.curse)
];

export const defaultAttackModifierCards: string[] = [
  AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, AttackModifierType.plus0, // 6x +0
  AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1, AttackModifierType.plus1, // 5x +1
  AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1, AttackModifierType.minus1, // 5x -1
  AttackModifierType.plus2,
  AttackModifierType.minus2,
  AttackModifierType.double,
  AttackModifierType.null
];

export class AttackModifierDeck {

  attackModifiers: AttackModifier[];
  current: number;
  cards: AttackModifier[];

  constructor() {
    this.attackModifiers = JSON.parse(JSON.stringify(defaultAttackModifier));
    this.current = -1;
    this.cards = defaultAttackModifierCards.map((id) => this.cardById(id) || new AttackModifier(AttackModifierType.invalid));
  }

  cardById(id: string): AttackModifier | undefined {
    let attackModifier = this.attackModifiers.find((attackModifier) => attackModifier.id == id);
    if (!attackModifier) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(attackModifier));
  }

  toModel(): GameAttackModifierDeckModel {
    return new GameAttackModifierDeckModel(this.current, this.cards.map((attackModifier) => attackModifier && attackModifier.id || ""));
  }

  fromModel(model: GameAttackModifierDeckModel) {
    if (model.current != this.current) {
      this.current = model.current;
    }
    if (this.cards.length != model.cards.length || !this.cards.map((card) => card.id).every((cardId, index) => model.cards[ index ] == cardId)) {
      this.cards = model.cards.map((id) => this.cardById(id) || new AttackModifier(AttackModifierType.invalid));
    }
  }
}

export class GameAttackModifierDeckModel {
  current: number;
  cards: string[];

  constructor(current: number,
    cards: string[]) {
    this.current = current;
    this.cards = cards;
  }
}