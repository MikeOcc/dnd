interface Description {
  full: string[];
  short: string;
}

const DESCRIPTIONS: Record<string, Description> = {
  'slime-mold': {
    full: ['The air here reeks of slime mold.'],
    short: 'The mold smell is strong here.',
  },
  'deep-scratches': {
    full: ['Deep scratches score the stone walls.'],
    short: 'The scratches continue here.',
  },
  'goblin-bones': {
    full: ['The floor is littered with cracked goblin bones.'],
    short: 'More goblin bones crunch underfoot.',
  },
  'cold-wind': {
    full: ['A cold wind passes through you,', 'although the air is still.'],
    short: 'Again that strange cold passes through you.',
  },
  'stone-animals': {
    full: [
      'Dozens of tiny stone animals lie scattered',
      'across the floor.',
      '',
      'Each was once alive.',
    ],
    short: 'More stone animals here. Be careful what you look at.',
  },
  'carved-eye': {
    full: [
      'An enormous eyeball has been carved into the wall.',
      '',
      'It appears to be watching you.',
    ],
    short: 'Another eye carved into the stone.',
  },
  'ozone': {
    full: [
      'A faint smell of ozone hangs in the air.',
      '',
      'Your hair stands on end.',
    ],
    short: 'The ozone smell is thicker here.',
  },
  'ancient-torch': {
    full: [
      'An ancient torch bracket rusts on the wall.',
      'Whatever light it once held is long gone.',
    ],
    short: 'Another empty torch bracket.',
  },
  'worn-stone': {
    full: [
      'The stone floor is worn smooth here,',
      'by the passage of many feet over many years.',
    ],
    short: 'The stone continues to be well-worn.',
  },
  'distant-sound': {
    full: [
      'You hear something far away — a scraping,',
      'rhythmic sound that fades before you can identify it.',
    ],
    short: 'The distant scraping sound again.',
  },
  'dried-blood': {
    full: [
      'Dried blood stains the floor in a wide arc.',
      'Something died here violently.',
    ],
    short: 'More old bloodstains.',
  },
  'iron-smell': {
    full: ['The air carries a strong smell of iron and rust.'],
    short: 'That iron smell again.',
  },
  'smoky-air': {
    full: ['The air here smells of old smoke.'],
    short: 'The smoke smell persists.',
  },
  'boot-prints': {
    full: [
      'Boot prints are pressed into the dust.',
      'They lead further into the dark.',
    ],
    short: 'The boot prints continue.',
  },
  'cobwebs': {
    full: ['Enormous cobwebs cling to the ceiling.', 'Nothing moves in them.'],
    short: 'More webs overhead.',
  },
  'mold-patches': {
    full: [
      'Patches of dark mold grow on the walls.',
      'They seem to pulse slowly.',
    ],
    short: 'More mold on the walls.',
  },
  'slime-trail': {
    full: [
      'A glistening trail crosses the corridor.',
      'Something large and wet has passed this way.',
    ],
    short: 'The slime trail continues.',
  },
  'gnawed-bones': {
    full: ['Bones gnawed clean lie in a heap.', 'Something feeds here regularly.'],
    short: 'More gnawed bones.',
  },
  'rat-squeaks': {
    full: ['You hear frantic squeaking somewhere in the walls.'],
    short: 'Squeaking sounds in the walls again.',
  },
  'fetid-air': {
    full: ['The air here is thick and rotten.'],
    short: 'The stench worsens.',
  },
  'green-stain': {
    full: ['A green stain marks the wall, running floor to ceiling.', 'It is still wet.'],
    short: 'More green staining.',
  },
  'rotten-smell': {
    full: ['Something nearby is decaying.'],
    short: 'The rot smell grows stronger.',
  },
  'dirty-water': {
    full: ['Filthy water seeps through the floor here.'],
    short: 'More water seeping through.',
  },
  'claw-marks': {
    full: ['Large claw marks scar the stone at shoulder height.'],
    short: 'More claw marks.',
  },
  'distant-chanting': {
    full: ['Distant voices seem to be chanting.', 'You cannot make out the words.', 'You are not sure you want to.'],
    short: 'The chanting is audible again.',
  },
  'frost-coating': {
    full: [
      'The corridor is coated with a thin layer of frost.',
      '',
      'Your breath mists before you.',
    ],
    short: 'More frost. Something cold is nearby.',
  },
  'bone-dust': {
    full: ['The floor is covered in fine bone dust.', 'It rises with each step.'],
    short: 'Bone dust again.',
  },
  'stone-sarcophagus': {
    full: [
      'A stone sarcophagus rests in an alcove.',
      'Its lid has been pushed aside from within.',
    ],
    short: 'Another empty sarcophagus.',
  },
  'candle-stub': {
    full: [
      'A candle stub sits in a pool of hardened wax.',
      'Someone was here not long ago.',
    ],
    short: 'Another candle stub.',
  },
  'death-smell': {
    full: ['The smell of death saturates the air here.'],
    short: 'The death smell is overwhelming.',
  },
  'eerie-silence': {
    full: [
      'The silence here is complete.',
      'Your footsteps seem muffled, as though the stone itself',
      'wishes to muffle your presence.',
    ],
    short: 'That eerie silence again.',
  },
  'unnatural-cold': {
    full: [
      'An unnatural cold seeps through your clothing.',
      '',
      'The dead walk here.',
    ],
    short: 'The unnatural cold again.',
  },
  'hollow-echoes': {
    full: ['Your footsteps echo strangely here, as though the walls are hollow.'],
    short: 'The echoes continue.',
  },
  'dust-drift': {
    full: ['Fine dust drifts through the air, though you feel no wind.'],
    short: 'More drifting dust.',
  },
  'weeping-stone': {
    full: ['Water weeps slowly through the stone above you.', 'Or perhaps it is not water.'],
    short: 'The weeping stone above.',
  },
  'grave-smell': {
    full: ['The smell of fresh-turned earth fills the corridor.', 'There is no soil down here.'],
    short: 'That grave smell again.',
  },
  'old-darkness': {
    full: ['The darkness here feels old and deliberate.'],
    short: 'The old darkness closes in again.',
  },
  'warm-stones': {
    full: ['The stones are scorched and warm beneath your feet.'],
    short: 'The stones remain warm.',
  },
  'acid-pitting': {
    full: ['The walls are pitted as though splashed with acid.'],
    short: 'More acid pitting on the walls.',
  },
  'scorched-floor': {
    full: ['The floor is scorched black.', 'The heat is recent.'],
    short: 'The scorched floor continues.',
  },
  'giant-footprint': {
    full: ['A footprint pressed into the stone floor.', 'It is larger than your torso.'],
    short: 'More giant footprints.',
  },
  'huge-bones': {
    full: ['Bones the size of logs litter the corridor.', 'Something enormous died here.'],
    short: 'More enormous bones.',
  },
  'deep-grooves': {
    full: ['Deep grooves have been gouged into the stone wall.', 'They run parallel, floor to ceiling.'],
    short: 'More deep grooves.',
  },
  'crystal-growths': {
    full: ['Strange crystal formations grow from the wall.', 'They glow faintly.'],
    short: 'More crystal formations.',
  },
  'underground-river': {
    full: ['You hear the sound of running water beneath the floor.'],
    short: 'The underground river can still be heard.',
  },
  'earthquake-crack': {
    full: ['A wide crack runs across the ceiling.', 'Small stones fall occasionally.'],
    short: 'Stones still fall from the crack above.',
  },
  'mineral-smell': {
    full: ['The air carries a sharp mineral smell.'],
    short: 'That mineral smell again.',
  },
  'echoing-roar': {
    full: ['A distant roar echoes through the stone.', 'It is large. It is below you.'],
    short: 'Another distant roar.',
  },
  'rubble-pile': {
    full: ['A pile of collapsed stone blocks the way partially.'],
    short: 'More rubble.',
  },
  'stalactites': {
    full: ['Long stalactites hang from the ceiling like stone teeth.'],
    short: 'The stalactites continue overhead.',
  },
  'hot-stone': {
    full: ['The stone walls radiate heat.', 'Something nearby burns.'],
    short: 'The walls are still hot.',
  },
  'far-thunder': {
    full: ['You hear something like thunder, deep in the rock.'],
    short: 'That sound like thunder again.',
  },
  'scale-large': {
    full: [
      'Scales as large as shields lie scattered',
      'across the floor.',
      '',
      'They still smell of smoke.',
    ],
    short: 'More enormous scales.',
  },
  'acid-splash': {
    full: [
      'The walls are pitted and discolored.',
      'Acid has been splashed here in great quantities.',
    ],
    short: 'More acid splash damage.',
  },
  'smoke-smell': {
    full: ['The air tastes of smoke.'],
    short: 'That smoke taste again.',
  },
  'sulfur-smell': {
    full: ['A strong sulfur smell burns your nostrils.'],
    short: 'The sulfur smell persists.',
  },
  'claw-gouges-stone': {
    full: ['Enormous claw gouges scar the floor.', 'Whatever made them was very large.'],
    short: 'More claw gouges.',
  },
  'molten-rock': {
    full: ['A thin stream of cooled lava crosses the corridor.', 'It hardened recently.'],
    short: 'More cooled lava.',
  },
  'steam-vent': {
    full: ['Steam vents from a crack in the floor.', 'The heat is intense.'],
    short: 'Another steam vent.',
  },
  'drake-skull': {
    full: ['A dragon skull the size of a wagon rests against the wall.', 'Its eye sockets are empty.'],
    short: 'More draconic remains.',
  },
  'burnt-armor': {
    full: ['Melted armor lies fused to the floor.', 'Someone tried to fight here.'],
    short: 'More burnt armor.',
  },
  'acid-pools': {
    full: ['Small pools of acid dot the floor.', 'You step carefully.'],
    short: 'More acid pools. Watch your step.',
  },
  'heat-shimmer': {
    full: ['The air shimmers with heat.'],
    short: 'The heat shimmer continues.',
  },
  'psychic-hum': {
    full: ['A low hum fills the back of your mind.', 'Thoughts that are not yours flicker briefly.'],
    short: 'The psychic hum again.',
  },
  'black-water': {
    full: ['Black water runs silently along the base of the wall.', 'It reflects nothing.'],
    short: 'More black water.',
  },
  'strange-sigil': {
    full: ['A strange sigil is drawn on the floor in something dark.', 'You step around it.'],
    short: 'Another sigil on the floor.',
  },
  'whisper-wall': {
    full: ['If you press your ear to the wall you can hear whispering.', 'You decide not to.'],
    short: 'The whispering walls again.',
  },
  'impossible-shadow': {
    full: ['A shadow falls across the corridor.', 'Nothing is casting it.'],
    short: 'Another impossible shadow.',
  },
  'broken-mind-rune': {
    full: ['A shattered rune lies on the floor.', 'Even broken, it fills you with unease.'],
    short: 'More broken runes.',
  },
  'crystalline-web': {
    full: ['Crystalline threads connect the walls like an enormous web.', 'Something built this deliberately.'],
    short: 'The crystalline web continues.',
  },
  'void-stain': {
    full: ['A dark stain marks the wall.', 'Looking at it too long makes your eyes water.'],
    short: 'Another void stain.',
  },
  'dead-magic': {
    full: ['The air feels flat and wrong here.', 'Magic seems to resist working in this place.'],
    short: 'The dead magic zone again.',
  },
  'alien-script': {
    full: ['Writing covers one wall, floor to ceiling.', 'No language you know.'],
    short: 'More alien script.',
  },
  'eye-shapes': {
    full: ['The stone walls are patterned with carved eyes.', 'All watching. All different.'],
    short: 'More carved eyes.',
  },
  'silence-zone': {
    full: ['A pocket of absolute silence.', 'Your footsteps make no sound.'],
    short: 'Another silence zone.',
  },
  'dark-altar': {
    full: ['A small, dark altar sits in an alcove.', 'You give it a wide berth.'],
    short: 'Another dark altar.',
  },
  'rivers-of-fire': {
    full: ['Rivers of fire run between the black stones.', 'The heat is extraordinary.'],
    short: 'The rivers of fire continue.',
  },
  'infernal-runes': {
    full: ['Infernal runes are burned into the floor.', 'They pulse with dark light.'],
    short: 'More infernal runes.',
  },
  'iron-throne-distant': {
    full: ['In the far distance, you can see the iron throne.', 'It is occupied.'],
    short: 'The iron throne is still visible in the distance.',
  },
  'screaming-wind': {
    full: ['The wind here screams.', 'You cover your ears.'],
    short: 'The screaming wind again.',
  },
  'bone-architecture': {
    full: ['The walls are built from bones.', 'Enormous bones. They were not all animal.'],
    short: 'The bone walls continue.',
  },
  'brimstone': {
    full: ['The air is thick with brimstone.', 'Your eyes water.'],
    short: 'That brimstone smell again.',
  },
  'infernal-heat': {
    full: ['The heat here is beyond natural.', 'The stone itself seems to sweat.'],
    short: 'The infernal heat intensifies.',
  },
  'demon-marks': {
    full: ['Territorial marks are burned into every surface.', 'This is claimed land.'],
    short: 'More territorial marks.',
  },
  'hellish-choir': {
    full: ['Something sings in the distance.', 'The melody fills you with dread.'],
    short: 'The choir again.',
  },
  'gravity-wrong': {
    full: ['Gravity feels slightly wrong here.', 'You keep your eyes on the floor.'],
    short: 'Gravity is still wrong here.',
  },
  'time-distortion': {
    full: ['Time feels stretched here.', 'A moment takes too long.'],
    short: 'The time distortion again.',
  },
  'asmodeus-presence': {
    full: [
      'You feel a presence ahead.',
      '',
      'Ancient. Patient. Aware of you.',
      '',
      'Asmodeus knows you are coming.',
    ],
    short: 'The presence grows stronger.',
  },
  'scorched-angels': {
    full: ['Stone angels line the wall.', 'All of them are burned.', 'All of them look away.'],
    short: 'More burned angels.',
  },
  'final-warning': {
    full: [
      'Scratched into the stone by someone desperate:',
      '',
      'TURN BACK',
    ],
    short: 'Another scratched warning.',
  },
};

export function getDescription(id: string): string[] | null {
  return DESCRIPTIONS[id]?.full ?? null;
}

export function getDescriptionShort(id: string): string[] | null {
  const d = DESCRIPTIONS[id];
  if (!d) return null;
  return [d.short];
}
