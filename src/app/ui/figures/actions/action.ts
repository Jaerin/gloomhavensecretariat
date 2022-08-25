import { JsonPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/Action';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';

@Component({
  selector: 'ghs-action',
  templateUrl: './action.html',
  styleUrls: [ './action.scss' ]
})
export class ActionComponent implements OnInit {

  @Input() monster!: Monster;
  @Input() action!: Action;
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
  @Input() statsCalculation: boolean = false;
  @Input() hexSize!: number;

  additionalSubActions: Action[] = [];
  additionAttackSubActionTypes: ActionType[] = [ ActionType.condition, ActionType.target, ActionType.pierce, ActionType.pull, ActionType.push, ActionType.swing, ActionType.area ];

  ActionType = ActionType;
  ActionValueType = ActionValueType;

  invertIcons: ActionType[] = [ ActionType.attack, ActionType.fly, ActionType.heal, ActionType.jump, ActionType.loot, ActionType.move, ActionType.range, ActionType.retaliate, ActionType.shield, ActionType.target, ActionType.teleport ];

  hasAOE: boolean = false;

  getNormalValue() {
    if (this.monster.boss) {
      return this.getValue(MonsterType.boss);
    }
    return this.getValue(MonsterType.normal);
  }

  getEliteValue() {
    if (!this.monster.entities.some((monsterEntity) => monsterEntity.type == MonsterType.elite && !monsterEntity.dead)) {
      return this.getNormalValue();
    }

    return this.getValue(MonsterType.elite);
  }

  getStat(type: MonsterType): MonsterStat {
    return gameManager.monsterManager.getStat(this.monster, type);
  }

  getValues(action: Action): string[] {
    if (action.value && typeof action.value === "string") {
      return action.value.split('|');
    }
    return [];
  }

  getSpecial(action: Action): Action[] {
    return this.getStat(MonsterType.boss).special[ (action.value as number) - 1 ];
  }

  getValue(type: MonsterType): number | string {
    const stat = this.getStat(type);
    if (settingsManager.settings.calculate && !this.relative) {
      let statValue: number = 0;
      let sign: boolean = true;
      switch (this.action.type) {
        case ActionType.attack:
          if (typeof stat.attack === "number") {
            statValue = stat.attack;
          } else {
            try {
              statValue = EntityValueFunction(stat.attack, this.monster.level);
            } catch {
              sign = false;
            }
          }
          break;
        case ActionType.move:
          statValue = stat.movement;
          break;
        case ActionType.range:
          statValue = stat.range;
          break;
      }

      if (typeof this.action.value === "number" && sign) {
        if (isNaN(statValue)) {
          statValue = 0;
        }
        if (this.action.valueType == ActionValueType.plus) {
          return statValue + this.action.value;
        } else if (this.action.valueType == ActionValueType.minus) {
          return statValue - this.action.value;
        }
      }

    }

    if (this.action.valueType == ActionValueType.plus) {
      return "+ " + this.action.value;
    } else if (this.action.valueType == ActionValueType.minus) {
      return "- " + this.action.value;
    } else {
      return this.action.value;
    }
  }

  ngOnInit(): void {
    this.updateAdditionalSubActions();
    gameManager.uiChange.subscribe({
      next: () => {
        this.updateAdditionalSubActions();
      }
    })
  }

  updateAdditionalSubActions(): void {
    this.action.subActions = this.action.subActions || [];
    this.additionalSubActions = JSON.parse(JSON.stringify(this.action.subActions));
    if (settingsManager.settings.calculateStats) {
      const stat = gameManager.monsterManager.getStat(this.monster, this.monster.boss ? MonsterType.boss : MonsterType.normal);
      let eliteStat = this.monster.boss ? undefined : gameManager.monsterManager.getStat(this.monster, MonsterType.elite);
      if (this.action.type == ActionType.attack) {
        if (stat.range && (!this.action.subActions.some((subAction) => subAction.type == ActionType.range || subAction.type == ActionType.area && ("" + subAction.value).indexOf('active') != -1 || subAction.type == ActionType.specialTarget))) {
          const area = this.action.subActions.find((subAction) => subAction.type == ActionType.area);
          this.additionalSubActions.splice(area ? this.action.subActions.indexOf(area) + 1 : 0, 0, new Action(ActionType.range, 0, ActionValueType.plus));
        }

        if (stat.actions) {
          let normalActions: Action | undefined = undefined;
          stat.actions.filter((statAction) => this.additionAttackSubActionTypes.indexOf(statAction.type) != -1).forEach((statAction) => {
            const newStatAction = new Action(statAction.type, statAction.value, statAction.valueType, statAction.subActions);
            if (!this.subActionExists(this.action.subActions, newStatAction) && !this.subActionExists(this.additionalSubActions, newStatAction)) {
              if (statAction.type != ActionType.area || this.action.subActions.every((subAction) => subAction.type != ActionType.area)) {
                if (!eliteStat || eliteStat.actions && this.subActionExists(eliteStat.actions, newStatAction) || (settingsManager.settings.hideStats && !this.monster.entities.some((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && monsterEntity.type == MonsterType.elite))) {
                  this.additionalSubActions.push(newStatAction);
                } else if (eliteStat && (!eliteStat.actions || !this.subActionExists(eliteStat.actions, newStatAction))) {
                  if (!normalActions && !this.subActionExists(this.action.subActions, newStatAction) && !this.subActionExists(this.additionalSubActions, newStatAction)) {
                    normalActions = new Action(ActionType.monsterType, MonsterType.normal, ActionValueType.fixed, [ newStatAction ])
                    this.additionalSubActions.push(normalActions);
                  } else if (normalActions && !this.subActionExists(this.action.subActions, newStatAction) && !this.subActionExists(this.additionalSubActions, newStatAction) && !this.subActionExists(normalActions.subActions, newStatAction)) {
                    normalActions.subActions.push(newStatAction);
                  }
                }
              }
            }
          })
        }

        if (eliteStat && (!settingsManager.settings.hideStats || this.monster.entities.some((monsterEntity) => !monsterEntity.dead && monsterEntity.health > 0 && monsterEntity.type == MonsterType.elite))) {
          let eliteActions: Action | undefined = undefined;
          eliteStat.actions.filter((eliteAction) => this.additionAttackSubActionTypes.indexOf(eliteAction.type) != -1).forEach((eliteAction) => {
            const newEliteAction = new Action(eliteAction.type, eliteAction.value, eliteAction.valueType, eliteAction.subActions);
            if (!stat.actions || !this.subActionExists(stat.actions, newEliteAction)) {
              if (!eliteActions && !this.subActionExists(this.action.subActions, newEliteAction) && !this.subActionExists(this.additionalSubActions, newEliteAction)) {
                eliteActions = new Action(ActionType.monsterType, MonsterType.elite, ActionValueType.fixed, [ newEliteAction ]);
                this.additionalSubActions.push(eliteActions);
              } else if (eliteActions && !this.subActionExists(this.action.subActions, newEliteAction) && !this.subActionExists(this.additionalSubActions, newEliteAction) && !this.subActionExists(eliteActions.subActions, newEliteAction)) {
                eliteActions.subActions.push(newEliteAction);
              }
            }
          })
        }
      }
    }

    this.hasAOE = this.additionalSubActions.some((subAction, index) => index == 0 && subAction.type == ActionType.area)
  }

  subActionExists(additionalSubActions: Action[], subAction: Action): boolean {
    return additionalSubActions.some((action) => action.type == subAction.type && action.value == subAction.value && (action.valueType || ActionValueType.fixed) == (subAction.valueType || ActionValueType.fixed));
  }

  isInvertIcon(type: ActionType) {
    return this.invertIcons.indexOf(type) != -1;
  }

}