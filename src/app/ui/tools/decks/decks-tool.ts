import { Component, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { DeckData } from "src/app/game/model/data/DeckData";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/MonsterType";

@Component({
  selector: 'ghs-decks-tool',
  templateUrl: './decks-tool.html',
  styleUrls: ['./decks-tool.scss']
})
export class DecksToolComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  edition: string = "";
  monsters: Monster[] = [];
  characters: Character[] = [];
  character: boolean = false;
  entity: boolean = true;
  elite: boolean = true;
  level: number = 1;

  async ngOnInit() {
    await settingsManager.init();
    gameManager.stateManager.init();
    this.edition = gameManager.editions(true)[0];
    this.update();
  }

  update() {
    this.monsters = [];
    this.characters = [];
    if (!this.character) {
      const monsterData = gameManager.editionData.filter((editionData) => editionData.edition == this.edition).map((editionData) => editionData.monsters).flat().filter((monsterData, index, monsters) => monsterData.replace || !monsterData.replace && !monsters.find((monsterDataReplacement) => monsterDataReplacement.replace && monsterDataReplacement.name == monsterData.name && monsterDataReplacement.edition == monsterData.edition));

      this.monsters = monsterData.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1).map((monsterData) => {
        let monster = new Monster(monsterData, this.level);

        if (monster.boss && this.entity) {
          gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.boss);
        }

        if (!monster.boss && this.elite) {
          gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.elite);
        }
        if (!monster.boss && this.entity) {
          gameManager.monsterManager.addMonsterEntity(monster, 2, MonsterType.normal);
        }

        return monster;
      });
    } else {
      const characterData = gameManager.editionData.filter((editionData) => editionData.edition == this.edition).map((editionData) => editionData.characters).flat().filter((characterData) => gameManager.decksData(true).some((deckData) => deckData.name == characterData.deck || deckData.name == characterData.name));

      this.characters = characterData.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1).map((characterData) => {
        return new Character(characterData, this.level);
      });
    }

    gameManager.uiChange.emit();
  }

  deck(monster: Monster | Character): DeckData {
    return gameManager.deckData(monster);
  }


}
