import * as Blockly from 'blockly';

import { Command } from '../core/CommandDispatcher';

// Define the blocks
export const defineBlocks = () => {
  // Object: Timmy (Root Block)
  Blockly.Blocks['timmy_object'] = {
    init: function () {
      this.appendDummyInput().appendField('Timmy (Object)');
      this.appendStatementInput('PROPERTIES')
          .setCheck(null);
      this.setColour(20);
      this.setTooltip('This is the Timmy object. Attach state and behaviour inside.');
      this.setDeletable(false);
      this.setMovable(false); // Optional: if we want to fix it in place
    },
  };

  // State: Change Name
  Blockly.Blocks['change_name'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Change Name to')
        .appendField(new Blockly.FieldTextInput('Timmy'), 'NAME');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip('Change the character\'s name');
    },
  };

  // State: Change Shirt Colour
  Blockly.Blocks['change_shirt_colour'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Change Shirt Colour')
        .appendField(new Blockly.FieldDropdown([
          ['Blue', '#4F8EF7'],
          ['Red', '#F05252'],
          ['Green', '#31C48D'],
          ['Purple', '#9061F9']
        ]), 'COLOUR');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip('Change the character\'s shirt colour');
    },
  };

  // State: Set Energy
  Blockly.Blocks['set_energy'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Set Energy to')
        .appendField(new Blockly.FieldNumber(100, 0, 100), 'ENERGY');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip('Set the character\'s energy level');
    },
  };

  // Behaviour: Wave
  Blockly.Blocks['wave'] = {
    init: function () {
      this.appendDummyInput().appendField('Wave');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip('Make the character wave');
    },
  };

  // Behaviour: Walk Right
  Blockly.Blocks['walk_right'] = {
    init: function () {
      this.appendDummyInput().appendField('Walk Right');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip('Make the character walk to the right');
    },
  };

  // Behaviour: Jump
  Blockly.Blocks['jump'] = {
    init: function () {
      this.appendDummyInput().appendField('Jump');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip('Make the character jump');
    },
  };
};

// Generate commands from the blocks
export const generateCommands = (workspace: Blockly.WorkspaceSvg): Command[] => {
  const commands: Command[] = [];
  
  // Find the timmy_object root block
  const topBlocks = workspace.getTopBlocks(true);
  const timmyBlock = topBlocks.find(block => block.type === 'timmy_object');
  
  if (!timmyBlock) return commands;
  
  // Get the first block inside the 'PROPERTIES' statement input
  let currentBlock = timmyBlock.getInputTargetBlock('PROPERTIES');

  while (currentBlock) {
    switch (currentBlock.type) {
      case 'change_name':
        commands.push({
          type: 'changeName',
          target: 'timmy',
          payload: currentBlock.getFieldValue('NAME'),
        });
        break;
      case 'change_shirt_colour':
        commands.push({
          type: 'changeShirtColour',
          target: 'timmy',
          payload: currentBlock.getFieldValue('COLOUR'),
        });
        break;
      case 'set_energy':
        commands.push({
          type: 'setEnergy',
          target: 'timmy',
          payload: Number(currentBlock.getFieldValue('ENERGY')),
        });
        break;
      case 'wave':
        commands.push({
          type: 'wave',
          target: 'timmy',
        });
        break;
      case 'walk_right':
        commands.push({
          type: 'walkRight',
          target: 'timmy',
        });
        break;
      case 'jump':
        commands.push({
          type: 'jump',
          target: 'timmy',
        });
        break;
    }
    currentBlock = currentBlock.getNextBlock();
  }

  return commands;
};

export const toolboxConfig = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'State',
      colour: '160',
      contents: [
        { kind: 'block', type: 'change_name' },
        { kind: 'block', type: 'change_shirt_colour' },
        { kind: 'block', type: 'set_energy' },
      ],
    },
    {
      kind: 'category',
      name: 'Behaviour',
      colour: '230',
      contents: [
        { kind: 'block', type: 'wave' },
        { kind: 'block', type: 'walk_right' },
        { kind: 'block', type: 'jump' },
      ],
    },
  ],
};
