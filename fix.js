const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');
c = c.replace(/const MUSIC_TRACKS=\[[\s\S]*?\];/, `const MUSIC_TRACKS=[
  {name:'Oh, Mother Earth, so full of grace',file:'mother_earth.mp3'},
  {name:'Best Ever',file:'best_ever.mp3'},
  {name:'PASSO BEM SOLTO',file:'passo.mp3'},
  {name:'It\\'s Raining Tacos',file:'tacos.mp3'},
  {name:'ЛАВИНА (Steal the Brainrot)',file:'lavina.mp3'},
  {name:'Почвоведение',file:'pochvo.mp3'},
  {name:'Домики',file:'domiki.mp3'}
];`);
fs.writeFileSync('app.js', c);
