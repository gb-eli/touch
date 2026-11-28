'use strict';
// Expected results come from the pinned, real JavaScript model, not the Java port.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const sourcePath = 'public/js/voxel-world.js';
const bytes = fs.readFileSync(path.join(root, sourcePath));
const blob = crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const expectedBlob = 'aa9e941174e7dc3b3ffabc090abc30054f3d3afb';
if (blob !== expectedBlob) throw Error('Legacy model changed; review the domain contract before updating fixtures.');
const legacy = require(path.join(root, sourcePath));
const order = (a, b) => a.y - b.y || a.z - b.z || a.x - b.x;
const block = (x, y, z, material = 'stone') => ({x, y, z, material});
const load = blocks => ({version: 1, blocks});
const op = (operation, ...args) => ({operation, args});
const cases = [];
function scenario(id, description, operations) {
  const world = legacy.createWorld();
  const steps = operations.map(step => {
    const value = world[step.operation](...step.args);
    return {...step, expectedResult: value === undefined ? null : value,
      expectedState: {count: world.count, revision: world.revision,
        canUndo: world.canUndo, canRedo: world.canRedo}};
  });
  cases.push({id, description, steps,
    expectedBlocks: world.blocks.sort(order),
    expectedProgress: Object.fromEntries([...Object.keys(legacy.goals), 'unknown-mission']
      .map(id => [id, world.progress(id)]))});
}

scenario('empty_world', 'Mundo vazio e colocações disponíveis.', [
  op('canPlace', 0, 0, 0), op('canPlace', 7, 0, 7), op('canPlace', 0, 1, 0),
  op('has', 0, 0, 0), op('get', 0, 0, 0), op('undo'), op('redo'), op('clear')]);
scenario('bounds', 'Limites XYZ e empilhamento até Y5.', [
  ...Array.from({length: 6}, (_, y) => op('add', 0, y, 0, 'grass')),
  op('add', 7, 0, 7, 'crystal'), op('add', -1, 0, 0, 'stone'),
  op('add', 8, 0, 0, 'stone'), op('add', 0, -1, 0, 'stone'),
  op('add', 0, 6, 0, 'stone'), op('add', 0, 0, -1, 'stone'), op('add', 0, 0, 8, 'stone')]);
scenario('materials', 'Os nove IDs de material e rejeição de material desconhecido.', [
  ...legacy.MATERIALS.map((m, i) => op('add', i % 8, 0, Math.floor(i / 8), m.id)),
  op('add', 2, 0, 2, 'unknown'), op('get', 0, 0, 0)]);
scenario('face_adjacency', 'Vizinho por face permite encaixe; apenas diagonal não permite.', [
  op('add', 3, 1, 3, 'stone'), op('add', 3, 0, 3, 'stone'),
  op('add', 3, 1, 3, 'wood'), op('add', 4, 1, 3, 'ice'),
  op('add', 5, 2, 4, 'ice'), op('add', 4, 1, 3, 'sand')]);
scenario('remove_keeps_unsupported', 'Remover apoio não aplica gravidade aos blocos restantes.', [
  op('add', 3, 0, 3, 'stone'), op('add', 3, 1, 3, 'wood'), op('remove', 3, 0, 3),
  op('has', 3, 1, 3), op('add', 4, 1, 3, 'sand'), op('remove', 7, 5, 7)]);
scenario('move_source_is_not_support', 'A origem é excluída da verificação de apoio do destino.', [
  op('add', 3, 0, 3, 'wood'), op('move', {x:3,y:0,z:3}, {x:3,y:1,z:3}),
  op('move', {x:3,y:0,z:3}, {x:4,y:0,z:3}), op('get', 4, 0, 3),
  op('move', {x:4,y:0,z:3}, {x:4,y:0,z:3}), op('move', {x:3,y:0,z:3}, {x:5,y:0,z:3})]);
scenario('redo_invalidation', 'Falha preserva redo; nova edição válida descarta redo.', [
  op('add', 0, 0, 0, 'grass'), op('add', 1, 0, 0, 'wood'), op('undo'),
  op('add', 0, 0, 0, 'sand'), op('redo'), op('undo'), op('add', 2, 0, 0, 'ice'), op('redo')]);
scenario('clear_is_undoable', 'Limpar é edição recuperável; limpar vazio não cria histórico.', [
  op('clear'), op('add', 0, 0, 0, 'stone'), op('clear'), op('clear'), op('undo'), op('redo')]);
scenario('load_suspended', 'Importação válida preserva blocos suspensos e ordem arbitrária.', [
  op('load', load([block(3, 5, 3, 'wood'), block(0, 0, 0, 'grass')])),
  op('canPlace', 3, 4, 3), op('add', 3, 4, 3, 'stone')]);
scenario('load_is_undoable', 'Importar substitui o mundo somente depois da validação e pode ser desfeito.', [
  op('add', 0, 0, 0, 'grass'), op('load', load([block(7, 5, 7, 'crystal')])),
  op('undo'), op('redo'), op('load', load([])), op('undo')]);
scenario('load_identical', 'Importar uma cópia idêntica ainda incrementa revisão e adiciona histórico.', [
  op('load', load([])), op('undo'), op('add', 0, 0, 0, 'stone'),
  op('load', load([block(0,0,0)])), op('undo')]);
scenario('history_limit', 'Quarenta snapshots: a primeira de 41 edições deixa de poder ser desfeita.', [
  ...Array.from({length: 41}, (_, i) => op('add', i % 8, 0, Math.floor(i / 8), 'stone')),
  ...Array.from({length: 41}, () => op('undo'))]);

const full = Array.from({length:256}, (_, i) => block(i % 8, Math.floor(i / 64), Math.floor(i / 8) % 8));
scenario('capacity_and_move', '256 blocos impedem adicionar; mover preserva quantidade e continua possível.', [
  op('load', load(full)), op('add', 0, 4, 1, 'wood'),
  op('move', {x:0,y:3,z:0}, {x:0,y:4,z:1}), op('get', 0, 4, 1)]);

const invalidImports = [
  ['invalid_json', '{'], ['trailing_text', '{"version":1,"blocks":[]} garbage'],
  ['single_quotes', "{'version':1,'blocks':[]}"], ['trailing_comma', '{"version":1,"blocks":[],}'],
  ['leading_zero', '{"version":01,"blocks":[]}'], ['wrong_version', load([])],
  ['missing_blocks', {version:1}], ['wrong_blocks_type', {version:1,blocks:{}}],
  ['null_block', load([null])], ['duplicate_cell', load([block(0,0,0), block(0,0,0,'wood')])],
  ['missing_coordinate', load([{y:0,z:0,material:'stone'}])],
  ['string_coordinate', load([{x:'0',y:0,z:0,material:'stone'}])],
  ['fraction_coordinate', load([block(0.5,0,0)])],
  ['boolean_coordinate', load([{x:true,y:0,z:0,material:'stone'}])],
  ['null_coordinate', load([{x:null,y:0,z:0,material:'stone'}])],
  ['outside_grid', load([block(8,0,0)])], ['unknown_material', load([block(0,0,0,'air')])],
  ['too_many_blocks', load([...full, block(0,4,0)])]
];
invalidImports.find(([id]) => id === 'wrong_version')[1] = {version:2,blocks:[]};
for (const [id, input] of invalidImports) scenario('import_' + id,
  'Entrada inválida não modifica a construção nem seu histórico: ' + id,
  [op('add', 7, 0, 7, 'crystal'), op('load', input), op('get', 7, 0, 7)]);

scenario('numeric_equivalent_json', 'Números JSON integrais em notação decimal ou exponencial são válidos.', [
  op('load', '{"version":1e0,"blocks":[{"x":0.0,"y":-0,"z":0e0,"material":"stone"}]}')]);
for (const mission of ['tower', 'stairs', 'bridge', 'symmetry']) {
  const goal = legacy.goals[mission];
  const blocks = goal.map((cell, i) => ({...cell, material: legacy.MATERIALS[i % 9].id}));
  scenario('mission_' + mission, 'Missão considera coordenadas, aceita materiais diversos e blocos extras.', [
    op('load', load([...blocks, block(7,0,7,'lava')])), op('progress', mission),
    op('remove', goal[0].x, goal[0].y, goal[0].z), op('progress', mission), op('undo')]);
}

const rays = [
  ['floor_center', {x:0,y:10,z:0}, {x:0,y:-1,z:0}, []],
  ['floor_outside', {x:100,y:10,z:100}, {x:0,y:-1,z:0}, []],
  ['top_face', {x:.5,y:8,z:.5}, {x:0,y:-1,z:0}, [block(4,0,4)]],
  ['side_face', {x:8,y:.5,z:.5}, {x:-1,y:0,z:0}, [block(4,0,4)]],
  ['top_boundary', {x:.5,y:8,z:.5}, {x:0,y:-1,z:0}, [block(4,5,4)]],
  ['direction_normalized', {x:.5,y:8,z:.5}, {x:0,y:-10,z:0}, [block(4,0,4)]]
].map(([id,origin,direction,blocks]) => ({id,origin,direction,blocks,
  expected: legacy.raycast(origin, direction, blocks)}));

const fixture = {
  schemaVersion:1,
  baseline:{repository:'gb-eli/touch',commit:'9fda57ce924fff27e598cf1c3dcfb4d2cedf8a1a',sourcePath,gitBlob:blob},
  comparison:{blocksOrder:'Sort by y, then z, then x; insertion order is not a domain guarantee.',
    state:'revision/count/canUndo/canRedo are checked after every operation.',
    numbers:'Coordinates must be finite integral JSON numbers, never coerced strings/booleans.'},
  rules:{size:legacy.SIZE,height:legacy.HEIGHT,maxBlocks:legacy.MAX_BLOCKS,historyLimit:40},
  materials:legacy.MATERIALS,
  missions:legacy.goals,
  cases,rays
};
const target = path.join(root, 'tests/fixtures/voxel-contract.json');
fs.mkdirSync(path.dirname(target), {recursive:true});
fs.writeFileSync(target, JSON.stringify(fixture, null, 2) + '\n');
console.log(`Generated ${cases.length} scenarios, ${cases.reduce((n,c)=>n+c.steps.length,0)} operations and ${rays.length} rays from pinned JS.`);
