// lore-world.js
// World lore data for MMOLite — Age After War universe, Year 500 Post-Atlas
// The continent of Fortuna. The Helios Doctrine. The Rift that never should have opened.
// Provides queryable lore sections: timeline, races, factions, geography, random facts, regional rumors

// ---------------------------------------------------------------------------
// WORLD HISTORY — Timeline & Eras
// ---------------------------------------------------------------------------

const WORLD_HISTORY = {
  currentYear: 500,
  calendarName: 'Age After the Atlas',
  yearZeroEvent: 'Detonation of Heaven\'s Atlas within Calidar — the Elven and Dark Elven capital',

  eras: [
    {
      id: 'pre_war',
      name: 'The Age of Fortuna',
      yearRange: [-5000, -1],
      description: 'The long peace before the breaking of the world. The continent of Fortuna — called the Enlightened Continent and the Holy Lands by its human inhabitants — supported nine distinct peoples in a state of perpetual tension managed by interlocking treaties and the quiet threat of overwhelming force on all sides. At the center of this arrangement stood two pillars: Calidar, the desert oasis capital of the Elves and Dark Elves, whose marble spires entwined with obsidian towers were considered the most beautiful structures ever raised by mortal hands; and the Holy Dominion of Humanity, which worshipped the demi-god Helios as the supreme deity and demanded that every other race acknowledge the primacy of his divinity. That these two realities coexisted for millennia is either a testament to elven patience or a warning that the longer a fire is banked, the hotter it burns when it finally catches.'
    },
    {
      id: 'helios_doctrine',
      name: 'The Doctrine Era',
      yearRange: [-500, -1],
      description: 'Five centuries of creaking peace maintained by the Helios Doctrine — the formal theological and political framework that the Holy Dominion used to assert primacy over inter-racial affairs while stopping short of open war. Elves and Dark Elves, long-lived and powerful enough to resist the Dominion militarily, found the Doctrine insulting but not worth dying over. A small sect within the Dark Elven population disagreed. They watched the Dominion expand, watched it sabotage divine communications between other races and their gods, watched it position itself as the sole interpreter of divine will on Fortuna. They began reaching out to their own gods, seeking a response. The Dominion had been reading their messages for years.'
    },
    {
      id: 'year_zero',
      name: 'The Year of the Atlas',
      yearRange: [0, 0],
      description: 'The year the world broke. A Dominion warrior — righteous, devout, chosen personally by the Prophet-King — was given Heaven\'s Atlas: a mystical device forged by divine power and sealed with one of Helios\'s own organs. It glowed sickly green and burned at the touch and was carried in a great metal container. He swept through the approaches to Calidar like a plague, inflicting casualties on Elf and Dark Elf alike, and placed the device at the city\'s heart. What followed consumed the most beautiful place in the world in a hot flash of white light and sickening green fire. The desert oasis of Calidar — its marble colonnades, its obsidian towers, its centuries of accumulated civilization — became sickly green glass, hot ash, and fluctuating magma in seconds. The entirety of both Elven peoples within the city were gone before the light faded. A Dark Elven god, watching through the fire, placed a new and malicious artifact in the soldier\'s chest and opened a spatial rift at the epicenter. The soldier entered it. He has not returned.'
    },
    {
      id: 'early_age',
      name: 'Early Age After the Atlas',
      yearRange: [1, 100],
      description: 'The stunned aftermath. The Holy Dominion declared the destruction of Calidar a divine act — Helios\'s judgment upon those who refused to honor his primacy. The Magic Ban was enacted in Year 1: all unlicensed magic is now punishable by imprisonment or execution, enforced by the newly created Luminary Inquest. The surviving High Elves — those who had not been in Calidar when the Atlas detonated — were absorbed into the Dominion as an administrative caste. Dark Elves, blamed for the crisis that provoked the Atlas deployment, were subjected to systematic persecution that reduced their population to near-extinction. The Rift at the old human capital — the spatial tear created by the Dark Elven god as punishment and warning — began to grow. Creatures emerged. The Dominion classified it as a divine testing ground and sealed public access. The Veiled Hand, founded in secret by surviving lizardfolk astronomers who had watched everything, began identifying individuals whose decisions might produce another Atlas.'
    },
    {
      id: 'middle_period',
      name: 'The Middle Period',
      yearRange: [101, 299],
      description: 'The Dominion consolidated its absolute authority across Fortuna. The Helios Doctrine became unassailable state theology. Temples to any god other than Helios were closed or converted. The High Elves processed the Dominion\'s paperwork and kept its records and privately knew, from their sealed archives, that Helios was not the supreme deity the Doctrine claimed — that he was a demi-god, born of a divine father and a mortal mother, and that the Atlas had nearly destroyed him along with Calidar. They kept this knowledge carefully filed under seventeen cross-references in sections the Inquest had never fully reviewed. The Rift at the old capital grew wider. The Dominion continued to deny its significance.'
    },
    {
      id: 'late_period',
      name: 'The Stirring',
      yearRange: [300, 449],
      description: 'Something changed beneath the continent. Corruption began spreading outward from the Rift in patterns the Adventure Guild\'s earliest members had not seen before. New, smaller rifts appeared in outlying regions — not near Calidar, but near settlements distant from the original site. The Dominion\'s official position was that these were aftershocks of the original Atlas detonation. The Veiled Hand and the Astronomy Sect suspected otherwise. The creature at the center of the Rift — the soldier, now something else entirely — had found a way to push a sliver of himself outward. What the Dominion\'s scholars had begun calling "lich activity" was not random. It was directed.'
    },
    {
      id: 'guild_age',
      name: 'The Guild Age',
      yearRange: [450, 499],
      description: 'The founding of the Adventure Guild in Year 450 transformed the Dominion\'s panicked response to Rift incursions into a structured profession. The Guild established a ten-rank progression system and — crucially — created a neutral institution that all races could participate in without pledging allegiance to any nation. Guild towns sprang up near active Rift sites, becoming the only places on Fortuna where eight races could share a table without imperial documentation defining the arrangement. The Rift continued to grow. The creature within it continued to expand his strongholds, sending necromancers to tear the fabric of the world wherever his influence could reach.'
    },
    {
      id: 'present',
      name: 'The Present Day',
      yearRange: [500, 500],
      description: 'Year 500. The Rift has begun to truly stir. New rifts are forming in settlements across Fortuna — the one near your starting town is among the most recent. The Dominion has declared a nationwide call for citizens to enlist in the Adventure Guild and assist with containment. Magic users outside of Inquest-approved licensees are still imprisoned and executed. The creature the Dominion calls a lich — the soldier who carried the Atlas into Calidar, now something ancient and divine-touched and furious — wanders the continent creating strongholds, raising the dead, and sending necromancers to widen the tears in the world. He does not want conquest. He wants out. He wants to find his god. He will not find either. Helios is sealed below the Dominion\'s capital, drained of essence, barely alive. And the rift the Dark Elven god called punishment has become the defining crisis of the age. You find yourself in one of the smaller towns outside the capital where a new rift has formed. The Guild wants it contained. What is inside it, no one fully knows.'
    },
  ],

  timeline: [
    {
      year: -5000,
      era: 'pre_war',
      title: 'Founding of Calidar',
      description: 'Elven and Dark Elven arcanists establish the joint capital of Calidar on the edge of a desert oasis, transforming the surrounding land through generations of careful cultivation. Marble quarried from the western ranges and obsidian drawn up from volcanic deposits combine into a skyline unlike anything else on Fortuna. The city becomes the undisputed center of magical scholarship and the largest permanent settlement on the continent, its towers visible for miles across the desert.'
    },
    {
      year: -4200,
      era: 'pre_war',
      title: 'The Deep Compact',
      description: 'Dwarven holds formalize their labor federation, establishing the principles of collective ownership and syndicate governance that persist to the present day. The Deep Compact is carved into the living rock of Mount Anvarra and is considered the oldest continuously observed legal document in the world.'
    },
    {
      year: -3800,
      era: 'pre_war',
      title: 'The First Dominion',
      description: 'Human tribes on the central plains of Fortuna unite under a single prophetic vision: that Helios, the sun, is not merely a god but the god — the chief deity above all others, to whom every religion on the continent owes subordinate recognition. This is not purely theological. It is a claim to political primacy dressed in divine language. The Holy Dominion is born. Missionaries begin the long work of spreading the Helios Doctrine to every race on Fortuna, with varying degrees of persuasion.'
    },
    {
      year: -3100,
      era: 'pre_war',
      title: 'Gnomish Colonization of the Eastern Isles',
      description: 'Gnomish explorers establish permanent settlements across the eastern archipelago. Their natural aptitude for mechanical engineering, combined with abundant volcanic minerals, accelerates technological development far beyond the continental norm. The Collective emerges as a unified industrial state within three centuries, and the gnomes develop a quiet opinion of the Helios Doctrine: it is politics wearing theology\'s clothing, and they want no part of it.'
    },
    {
      year: -2500,
      era: 'pre_war',
      title: 'The Khanate Unification',
      description: 'Scattered orcish clans across the northern steppes of Fortuna are united under the first Great Khan, Vorath the Unbroken. The Khanate establishes seasonal migration routes, mounted warfare traditions, and the clan-moot system. Orcish shamans maintain their own theological traditions, acknowledging a pantheon of spirits and ancestral powers that the Helios Doctrine classifies as "lesser regional superstitions." The Khanate treats this classification as the insult it is.'
    },
    {
      year: -2000,
      era: 'pre_war',
      title: 'Lizardfolk Astronomy Sect Founded',
      description: 'Deep in the southern marshlands of Fortuna, lizardfolk scholars establish the Astronomy Sect, dedicated to observing celestial patterns and predicting catastrophic events. Their mathematical models, inscribed on stone tablets in a cipher that remains only partially decoded, prove unnervingly accurate over the millennia that follow. The Sect\'s oldest records include a notation about the peculiar energy signature of what they will later identify as the position of Heaven\'s Atlas — centuries before it is activated.'
    },
    {
      year: -1800,
      era: 'pre_war',
      title: 'The Dark Elven Schism',
      description: 'A theological dispute within Calidar\'s governing council — concerning the proper relationship between elven civilization and the human Helios Doctrine — fractures the unified elven civilization into two sub-peoples: the High Elves, who favor patient diplomacy and believe the Doctrine can be managed without confrontation, and the Dark Elves, who view the Dominion\'s theological expansionism as an existential threat requiring active resistance. Both peoples continue to share Calidar as their joint capital, but the fracture runs deep.'
    },
    {
      year: -1500,
      era: 'pre_war',
      title: 'Catfolk Civilization Peaks',
      description: 'The catfolk desert kingdoms reach their cultural zenith on Fortuna, establishing the Great Trade Roads that connect the Endless Desert to the northern plains. The Salt Court is first convened as a merchant parliament. Catfolk navigators map sea routes to the gnomish isles and maintain careful neutrality between the Dominion\'s theological claims and every other race\'s resistance to them.'
    },
    {
      year: -1200,
      era: 'pre_war',
      title: 'Goblin Warrens Discovered',
      description: 'Surface nations become aware of the vast goblin tunnel networks honeycombing Fortuna\'s subsurface. Initial contact is hostile. A series of brutal suppression campaigns drive goblins deeper underground and forge the resentment that fuels their resistance for millennia. The Dominion classifies goblins as "ungovernable vermin" in official documentation — a designation that will remain unchanged for twelve hundred years.'
    },
    {
      year: -600,
      era: 'pre_war',
      title: 'The Helios Doctrine Formalized',
      description: 'The Holy Dominion issues the formal Helios Doctrine — a comprehensive theological and political framework asserting that Helios is the primary deity of all peoples on Fortuna, that other races\' gods are lesser divine powers subordinate to his authority, and that the Dominion, as Helios\'s chosen people, has a divine mandate to administer the affairs of all other races. Elves and Dark Elves formally reject the Doctrine. Other races offer varying degrees of nominal compliance. The framework holds a fragile peace for centuries, its contradictions papered over by trade, mutual necessity, and the implicit understanding that Calidar\'s magical supremacy makes open war inadvisable.'
    },
    {
      year: -500,
      era: 'helios_doctrine',
      title: 'The Divine Communication Sabotage',
      description: 'Dominion intelligence confirms what its agents have suspected for decades: the other races of Fortuna have been attempting to communicate with their gods through divine channels that bypass the Dominion\'s theological authority. The Dominion begins systematically intercepting and disrupting these communications — sabotaging the divine correspondence between non-human races and their deities. High Elves document the interference but counsel patience. Dark Elves begin holding councils in silence, their communications reduced to written messages passed by hand to avoid interception.'
    },
    {
      year: -200,
      era: 'helios_doctrine',
      title: 'The Dark Elven Sect Emerges',
      description: 'A small but growing sect within the Dark Elven population concludes that patience has failed. They have watched the Dominion grow for centuries, watched it absorb territory and suppress theology and sabotage divine communication. They begin reaching out through ritual channels, seeking divine assistance in what they frame as a righteous correction of human arrogance. They do not know the Dominion has been reading their signals. They do not know what they are setting in motion.'
    },
    {
      year: -50,
      era: 'helios_doctrine',
      title: 'Heaven\'s Atlas Forged',
      description: 'The Prophet-King, having confirmed through intelligence channels that Dark Elven sects are actively soliciting divine intervention against the Dominion, tasks his greatest and most loyal warrior with a righteous mission: sever the Dark Elves from their gods and banish them from Fortuna forever. The weapon provided is Heaven\'s Atlas — a mystical device forged by divine power, sealed with one of Helios\'s own organs, glowing sickly green, burning to the touch. It is carried in a great metal container. The warrior is given a battalion of the Dominion\'s finest soldiers. He departs with certainty in his mission and no understanding of what Helios actually is.'
    },
    {
      year: -45,
      era: 'helios_doctrine',
      title: 'Death of the Great Khan Morghul',
      description: 'Great Khan Morghul the Undying, who has led the Khanate for over three centuries, falls in battle against a Dominion crusade army. His death fragments the Khanate into competing successor clans. The orcish war effort, already strained, collapses. Morghul\'s final words — "The steppe remembers" — become a rallying cry for orcish identity. In Calidar, the Dark Elven council receives word of the Khan\'s death and understands that their last potential military ally is gone.'
    },
    {
      year: -10,
      era: 'helios_doctrine',
      title: 'The Lizardfolk Warning',
      description: 'The Astronomy Sect delivers sealed prophecies to every head of state on Fortuna, warning of an imminent catastrophe that will "unmake the desert oasis and scar the sky for a thousand years, and open a wound that cannot be closed by mortal hands." Every recipient ignores the warning. The Dominion\'s Prophet-King receives his copy and orders it classified. The lizardfolk begin evacuating their southern holdings and send a private message to the leaders of the Dark Elven council. It arrives one week after the council\'s last formal session.'
    },
    {
      year: 0,
      era: 'year_zero',
      title: 'Heaven\'s Atlas Destroys Calidar — The Rift Opens',
      description: 'The Dominion warrior swept through the approaches to Calidar like a plague. High Elves and Dark Elves alike fell before his battalion. He placed the Atlas at the city\'s heart and activated it. His body and mind separated in the same instant. A High Elven god seized his consciousness and held him above Calidar as the hot flash of white light and sickening green fire consumed the city. Marble and obsidian became sickly green glass. The oasis boiled. The entirety of both Elven sub-peoples within the city were gone before the smoke rose. At the epicenter, a spatial rift tore open — shimmering with colors no one of this world had seen before, radiating otherworldly light. A Dark Elven god confronted the warrior\'s suspended soul: "Five souls lie within this rift caused by you. Five souls must be retrieved." The god implanted a new and malicious artifact square in the warrior\'s chest and thrust him into the rift. The Last World War ended. No one claimed victory. The rift remained.'
    },
    {
      year: 1,
      era: 'early_age',
      title: 'The Magic Ban and the Veiled Hand',
      description: 'In the stunned aftermath of Calidar\'s destruction, the Dominion declared the event a divine act of Helios and immediately enacted the Magic Ban — a sweeping prohibition on all unlicensed sorcery enforced by the newly created Luminary Inquest, with execution authority and no appeal process. The surviving High Elves were absorbed into the Dominion as an administrative caste. Dark Elves, blamed for having solicited divine intervention against the Dominion, were subjected to systematic persecution: their rights stripped, their communities dissolved, their numbers driven toward extinction by policies the Dominion characterized as "security measures." Simultaneously, in secret, surviving lizardfolk astronomers founded the Veiled Hand — an assassination network dedicated to preventing any power from accumulating enough to create another Atlas.'
    },
    {
      year: 5,
      era: 'early_age',
      title: 'The Rift Named — Dominion Concealment Begins',
      description: 'The spatial tear at the old human capital — created by the Dark Elven god at the epicenter of the Atlas detonation and moved as divine punishment to sit at the heart of the Dominion\'s power — is documented in classified imperial records as "the Rift." The Prophet-King orders all public knowledge of the Rift suppressed. The official position is that the site is a sacred zone of Helios\'s divine authority, closed to unauthorized visitors. The Inquest enforces this prohibition with lethal authority. Inside the Rift, something wanders. Something is looking for the five souls.'
    },
    {
      year: 50,
      era: 'early_age',
      title: 'First Rift Bleed Events',
      description: 'Unstable tears in reality begin manifesting near the primary Rift site and, increasingly, at distances that should not be possible given a single localized source. The Dominion\'s Inquest classifies these as "divine effluence" — evidence of Helios\'s power radiating outward. Lizardfolk astronomers observe that the pattern of secondary Rift manifestations is not random. Something inside the original Rift is directing the secondary formations. The Veiled Hand is informed. No consensus on response is reached.'
    },
    {
      year: 120,
      era: 'middle_period',
      title: 'Gnomish Withdrawal Begins',
      description: 'The Gnomish Collective begins systematically reducing contact with the continent of Fortuna. Internal documents reveal their assessment: the Holy Dominion is a political structure built on a theological lie, that lie is becoming harder to maintain as the Rift grows, and the Collective has no interest in being present when the lie collapses. Phase Three — a contingency plan whose full scope remains unknown to outsiders — is initiated.'
    },
    {
      year: 175,
      era: 'middle_period',
      title: 'The Catfolk Exodus',
      description: 'Desertification of the catfolk ancestral oases — accelerated by the mana contamination spreading from the Calidar site — forces the mass abandonment of permanent settlements. The trauma of displacement becomes a defining element of catfolk identity, transforming loss into a philosophy of radical adaptability. The Salt Court transitions from a merchant parliament to a mobile governing body, convening at shifting locations that no imperial census can track.'
    },
    {
      year: 250,
      era: 'middle_period',
      title: 'The Shadow Fen Commune Established',
      description: 'Refugees from every race — war criminals seeking anonymity, political dissidents, and the simply desperate — establish a commune in the southwestern swamplands. Protected by treacherous terrain and a phenomenon known as the Veil, Shadow Fen becomes a haven for those with nowhere else to go. The Veil, a natural mana anomaly inherent to the swamp, proves particularly effective at blocking Inquest scrying.'
    },
    {
      year: 320,
      era: 'middle_period',
      title: 'The Goblin Archive Incident',
      description: 'Dominion soldiers raid a goblin safehouse in the capital and discover an archive containing detailed intelligence on every Cardinal, general, and noble family in the empire — dating back over a century. The scope of goblin infiltration shocks Dominion leadership. A decade of purges follows, which fails to dismantle the network but succeeds in driving it deeper underground and eliminating several mid-level Inquest officers who had been quietly processing paperwork for goblin cells.'
    },
    {
      year: 350,
      era: 'late_period',
      title: 'The First Lich Stronghold Discovered',
      description: 'Adventure Guild scouts discover the first coherent stronghold of undead activity outside the immediate Rift vicinity — a fortified complex in the northern wastes staffed entirely by necromancers and animated corpses, oriented around a central sanctum that pulses with a signature the Guild\'s earliest magical scholars cannot classify. The Inquest moves to suppress the discovery. The Guild documents it anyway, cross-referencing it against Astronomy Sect predictions that had forecast "a foul light moving through the land, building its prisons from bone and dust."'
    },
    {
      year: 400,
      era: 'late_period',
      title: 'Orcish Suppression',
      description: 'The Holy Dominion launches a coordinated campaign to suppress orcish autonomy on the steppes of Fortuna, citing border raids and what the Doctrine classifies as "pagan necromantic communion." Clan lands are seized, sacred sites are consecrated to Helios, and orcish cultural practices are banned in occupied territories. Four clan elders die in imperial custody. The suppression drives many clans further north into the tundra and creates a generation of orcish warriors who have no interest in patience.'
    },
    {
      year: 450,
      era: 'guild_age',
      title: 'The Adventure Guild Founded',
      description: 'A coalition of veteran Rift fighters, sponsored by moderate factions in both the Dominion and the dwarven Free Holds, establishes the Adventure Guild. The Guild offers a radical proposition: a neutral institution, open to all races, dedicated to Rift containment and exploration. Its ten-rank system — Stone through Relic — provides structure and incentive. The first Guild Hall is built near the Rift site. The Dominion views it with suspicion. Every other race views it as the first institution in five hundred years that does not require them to subordinate their gods to Helios.'
    },
    {
      year: 480,
      era: 'guild_age',
      title: 'The Compact',
      description: 'The Rift Compact is signed by six of the eight racial governments, formally recognizing the Adventure Guild\'s authority over Rift zones and establishing the Guild\'s extraterritorial status within Guild towns. The Dominion signs under protest, viewing the Compact as an infringement on its divine mandate to govern Fortuna. The Dark Elven people, eliminated by Inquest campaigns over a century prior, were not represented. The Astronomy Sect sends a sealed note to all signatories that reads: "The source is within the Rift. It was placed there. It wants out."'
    },
    {
      year: 490,
      era: 'guild_age',
      title: 'Rise in Eldritch and Undead Incursions',
      description: 'Across the continent of Fortuna, scholars begin documenting a sharp rise in vampire sightings, werewolf attacks, leviathan appearances in the Shimmering Seas, and eldritch manifestations in formerly stable wilderness regions. The pattern is consistent: activity correlates with proximity to lich strongholds and secondary Rift sites. The Guild\'s research division publishes a classified assessment: the entity within the Rift is not contained. Something of him has been escaping, and it is changing the world around it.'
    },
    {
      year: 500,
      era: 'present',
      title: 'The Present Day — New Rifts, New Calls',
      description: 'Year 500. The Dominion has declared a nationwide call for enlistment in the Adventure Guild, acknowledging publicly for the first time that the Rift is not a divine testing ground but a genuine continental threat. New rifts are forming across Fortuna — not just near the original site but in smaller towns, near settlements, in places where people live. The entity the Dominion classifies as a lich has been pushing sliver after sliver of himself outward, sending necromancers to tear the fabric of the world wherever his influence can reach, building strongholds, raising the dead, corrupting everything within his grasp. He is trying to communicate with Helios. He is trying to free himself. He does not know that Helios is sealed below the capital — drained of essence, barely alive, used by the Dominion as a power source since the Atlas deployment nearly destroyed him. He does not know that the god he served was never what the Doctrine claimed. You find yourself in one of the smaller towns outside the capital where a new rift has just formed. Enter it. Find out what started this. And understand: there is no simple enemy here. There is only a man who was told to do something righteous, did it, and has been paying for it ever since.'
    },
  ],
};


// ---------------------------------------------------------------------------
// RACE LORE
// ---------------------------------------------------------------------------

const RACE_LORE = {
  human: {
    name: 'Humans',
    title: 'The Holy Dominion',
    population: '~1,500,000',
    lifespan: '70-90 years',
    government: 'Theocratic Empire ruled by the Prophet-King and the Council of Cardinals',
    summary: 'Humans are the most numerous race on Fortuna and the dominant political force in the Age After the Atlas. The Holy Dominion, their theocratic empire, controls the fertile central plains and projects power through military strength, religious authority, and sheer demographic weight. Human culture revolves around the Helios Doctrine — the belief that humanity\'s god Helios is the chief deity of all peoples, and that humanity is therefore divinely selected to shepherd the other races. This conviction fuels both genuine charity and ruthless imperialism in roughly equal measure. What the Doctrine does not acknowledge — and what the elven archivists know and have never published — is that Helios is a demi-god: his father was a divine lord who lay with a mortal woman, and thus Helios was born mortal enough to be sealed, drained, and used. The Prophet-Kings have been drawing on that sealed power for centuries. The divine has become a battery. The battery is running low.',
    culture: 'Dominion society is rigidly hierarchical, with the Prophet-King at the apex, followed by the Cardinal Council, the military aristocracy, and the common faithful. Religious observance is mandatory — citizens attend dawn prayers, tithe a tenth of their income to the Church, and are expected to undertake at least one pilgrimage in their lifetime. Despite this rigidity, human communities are remarkably adaptable. Frontier towns often develop their own local customs, and Guild towns under human influence tend to be the most cosmopolitan on Fortuna. Humans value industry, piety, and martial prowess, though the relative importance of each varies wildly by region.',
    homeland: 'The Central Plains of Fortuna — a vast expanse of farmland, fortified cities, and cathedral-towns stretching from the western mountains to the eastern coast. The capital, Solara, sits at the crossroads of every major trade route on the continent. Beneath Solara, in vaults that no Cardinal publicly discusses, Helios himself is sealed — alive, barely conscious, his divine essence siphoned to power imperial artifacts.',
    notableTraits: [
      'Shortest lifespan of the major races, driving urgency that other races find either admirable or exhausting',
      'Highest birth rate and fastest population recovery after conflicts',
      'Strong affinity for divine magic, particularly healing and protective wards — a legacy of their genuine connection to a real deity',
      'Adaptable to virtually any climate or terrain, with settlements in every biome on Fortuna',
      'Tendency toward institutional thinking — humans build organizations, hierarchies, and bureaucracies instinctively',
      'A growing moderate faction within the Church that senses something has gone wrong at the theological core of the Doctrine'
    ],
    relations: {
      elf: 'Complex and fraught. Elves serve as the Dominion\'s administrative backbone, but the shared knowledge — acknowledged by no one in polite company — that humans destroyed the elven homeland creates a permanent undercurrent of guilt and resentment. The elves know about Helios\'s true nature. They have never published it. The reasons for this restraint are debated internally.',
      darkElf: 'Extinct. The Dominion\'s policies after Year 0 pursued total eradication — Inquest documents call it "cultural dissolution," a phrase chosen to avoid the word "extermination." Systematic campaigns by the Luminary Inquest over the following century eliminated every identified Dark Elf survivor. By Year 100, none remained. The Dominion considers the matter resolved. In this case, it is.',
      orc: 'Openly hostile. The Dominion views orcish culture as barbaric paganism and has conducted multiple suppression campaigns. Orcs view the Dominion as an imperialist oppressor. Individual humans and orcs can coexist in Guild towns, but institutional relations remain poisonous.',
      dwarf: 'Respectful but distant. The Dominion covets dwarven metalwork and engineering but finds their anarcho-syndicalist politics baffling and their theology nonexistent.',
      gnome: 'Wary. The gnomish withdrawal deepens suspicion. The Dominion remembers that gnomish precision instruments contributed to Heaven\'s Atlas and has never fully trusted the Collective.',
      goblin: 'Contemptuous. Standing bounties. Classified as vermin. The goblins are aware of this classification and have been building their response for five hundred years.',
      lizardfolk: 'Indifferent. Most humans are barely aware that lizardfolk have a civilization. The Astronomy Sect prefers it this way.',
      catfolk: 'Tolerant. Catfolk traders are welcome in Dominion markets, and their gambling establishments are popular if technically illegal.'
    }
  },

  elf: {
    name: 'Elves (High Elves)',
    title: 'The Administration',
    population: '~500,000',
    lifespan: '500-800 years (Ancient Ones: 10,000+ years)',
    government: 'Bureaucratic caste within the Holy Dominion; no independent sovereign government',
    summary: 'The High Elves are a people defined by survival through service. Their joint homeland of Calidar — shared with the Dark Elves — was destroyed in Year 0 by Heaven\'s Atlas. The survivors were absorbed into the Holy Dominion as an administrative caste, their bureaucratic skill and extraordinary lifespans making them invaluable record-keepers for an empire they had every reason to hate. Elven archivists now run the empire that annihilated their civilization — processing tax records, managing logistics, and maintaining the legal infrastructure that holds the Dominion together. The oldest among them, the Ancient Ones, remember Calidar firsthand: the marble colonnades, the obsidian towers, the dark elves who shared their city and their history. They carry that memory like an open wound and file every document related to it under cross-references the Inquest has never fully traced.',
    culture: 'Elven culture in the Age After the Atlas is one of quiet endurance and sublimated grief. Public mourning for Calidar is suppressed by the Dominion, so elves have developed coded commemorations — specific flower arrangements, architectural details, musical phrases that remember the lost city without triggering censorship. Among themselves, the most important secret they maintain is a sealed file documenting Helios\'s true nature: that he is a demi-god, that the Atlas burned through most of his divine essence, and that the Dominion has been siphoning what remains for centuries. This information is leverage. It has never been used. The elves who know it are still deciding when the time is right.',
    homeland: 'Formerly Calidar, on the edge of a southern desert oasis. Now a fifty-mile waste of sickly green glass, hot ash, and residual magical contamination. Elves reside throughout the Dominion, with the highest concentrations in Solara and the southern administrative districts. Some elven communities maintain small enclaves near the Calidar waste, as close to their lost homeland as safety permits.',
    notableTraits: [
      'Extraordinary longevity — Ancient Ones who remember Calidar at its height still live and grieve',
      'Natural affinity for arcane magic, heavily restricted under the Magic Ban',
      'Eidetic cultural memory maintained through oral tradition and coded art',
      'Bureaucratic expertise that makes the Dominion\'s governance functionally possible',
      'In possession of sealed intelligence about Helios\'s true nature that they have not yet deployed'
    ],
    relations: {
      human: 'Resentful dependence. Elves serve the empire that destroyed their home because the alternative — statelessness and elimination — is worse. Younger elves are more accepting. Ancient Ones have not forgiven and are not close to it.',
      darkElf: 'Grief and guilt. High Elves and Dark Elves shared Calidar. Many High Elves blame themselves for counseling patience rather than resistance when the Dark Elven sect was seeking divine aid. There are no surviving Dark Elves to welcome. The High Elves who remember them carry that weight in silence.',
      orc: 'Sympathetic but distant. Both races have suffered at Dominion hands. Historical elven imperialism in pre-war Fortuna prevents full solidarity.',
      dwarf: 'Mutual respect. Elven scholarship and dwarven craftsmanship complement each other. The two races maintained cordial relations even during the periods of greatest Dominion pressure.',
      gnome: 'Complicated. Gnomish engineering precision contributed to Heaven\'s Atlas. Elves consider this a significant moral failing regardless of what the Collective\'s internal debates produced.',
      goblin: 'Cautiously cooperative. Goblin intelligence networks and elven administrative access create natural synergies for those willing to take risks.',
      lizardfolk: 'Respectful. Elves are among the few races that take lizardfolk astronomical predictions seriously, having ignored the Year -10 warning to their eternal regret.',
      catfolk: 'Warm. Catfolk traders were among the first to offer aid to elven refugees after Year 0. The debt is remembered in specific detail.'
    }
  },

  orc: {
    name: 'Orcs',
    title: 'The Clans',
    population: '~240,000',
    lifespan: '300-500 years',
    government: 'Nomadic confederation of semi-autonomous clans, governed by clan-moots and (formerly) the Great Khan',
    summary: 'The orcs are a proud, long-lived people whose nomadic civilization has been systematically dismantled by centuries of Dominion aggression. Once unified under the Great Khan Morghul — who fell in Year -45, five years before Calidar\'s destruction — the Khanate fragmented and has never recovered. The suppression campaigns of Year 400 destroyed sacred sites, banned cultural practices, and drove entire clans into the frozen tundra. Despite this, orcish identity endures — carried in oral epics, mounted traditions, and a fierce commitment to clan sovereignty. In Guild towns, orcs have found something unexpected: a place where their martial skills are valued without requiring them to submit to Helios or acknowledge his primacy.',
    culture: 'Orcish culture centers on the clan — an extended kinship group that migrates together, shares resources, and defends collective territory. Each clan maintains its own traditions, totemic animals, and ancestral stories. The clan-moot makes decisions by consensus; no clan may be compelled against its will. Orcs value personal honor, martial excellence, hospitality to guests, and loyalty to kin. Their oral tradition is among the richest on Fortuna — orcish epic poetry can take days to recite. The Great Khan\'s death and the Khanate\'s subsequent fragmentation is not a historical event to most living orcs. It is a wound in the present tense.',
    homeland: 'The Northern Steppes of Fortuna — vast grasslands stretching from the Dominion\'s northern border to the tundra. Once expansive, orcish territorial control has shrunk dramatically since the suppression. Many clans now range in the Frostbound Reach, where Dominion patrols rarely venture.',
    notableTraits: [
      'Surprising longevity — 300-500 year lifespans mean clan elders carry centuries of lived experience',
      'Exceptional mounted warriors, bonded to steppe horses from childhood',
      'Rich oral tradition preserving thousands of years of history without written records',
      'Natural resilience to extreme cold, allowing survival in the Frostbound Reach',
      'Clan-moot governance that is genuinely democratic but maddeningly slow'
    ],
    relations: {
      human: 'Deep hostility. The suppression of Year 400 and ongoing Dominion encroachment have made reconciliation nearly impossible at the institutional level. Individual friendships exist. They do not accumulate into policy.',
      elf: 'Wary respect. Both races have suffered Dominion oppression. The memory of pre-war elven imperialism prevents full solidarity but does not preclude working relationships.',
      dwarf: 'Cordial. Dwarves and orcs share a distrust of centralized authority and a respect for craft traditions. Cross-border trade in metalwork and leather goods is common.',
      gnome: 'Indifferent. The gnomish isles are too distant for meaningful contact.',
      goblin: 'Allied. Goblin resistance cells have provided intelligence and logistical support to orcish clans for centuries. The relationship is one of genuine mutual aid.',
      lizardfolk: 'Curious. Orcish shamans and lizardfolk astronomers occasionally exchange knowledge at neutral sites. Both traditions value prophecy and the reading of signs.',
      catfolk: 'Friendly. Mixed trading posts exist along the desert-steppe border.'
    }
  },

  dwarf: {
    name: 'Dwarves',
    title: 'Free Holds of Stone',
    population: '~185,000',
    lifespan: '300-500 years',
    government: 'Anarcho-syndicalist labor federation of autonomous holds',
    summary: 'The dwarves live underground in self-governing holds connected by vast tunnel networks through the western mountain ranges of Fortuna. Their society is organized around labor syndicates — each hold is a federation of worker-owned workshops, forges, and mining cooperatives. There are no kings, no lords, and no inherited titles. Authority flows from expertise and the consent of one\'s fellow workers. The Free Holds refused to sign the Helios Doctrine in Year -600 on the grounds that it constituted an external authority asserting governance over theological questions that were properly internal matters. They have not changed this position. The empire has not successfully contested it.',
    culture: 'Dwarven culture is built around three pillars: craft, community, and stone. Every dwarf is apprenticed to a trade by age thirty. The quality of one\'s work is the primary measure of social standing. Holds govern themselves through syndicate councils where every worker has a vote. Dwarves are deeply suspicious of concentrated authority, having observed surface empires rise and fall while their federation endures. They value patience, precision, collective effort, and the deep silence of well-carved stone.',
    homeland: 'The Western Mountains of Fortuna — a range of peaks riddled with holds, tunnels, mine shafts, and underground cities. The deepest holds extend miles below the surface. The primary gateway to the surface is Ironhold, a trade town built at a mountain pass.',
    notableTraits: [
      'Unparalleled metallurgy and stonecraft — dwarven-forged weapons and armor are the continental standard on Fortuna',
      'Underground civilization with access to resources unavailable on the surface',
      'Anarcho-syndicalist governance that has remained stable for over four millennia',
      'Natural darkvision and resistance to underground hazards',
      'Deeply isolationist culture that views Fortuna\'s surface politics as dangerously unstable'
    ],
    relations: {
      human: 'Transactional. Dwarves sell finished goods to the Dominion and buy food in return. Political engagement is minimal and deliberate.',
      elf: 'Warm. Elven scholars and dwarven craftspeople share a mutual appreciation for precision and patience.',
      orc: 'Cordial. Both distrust the Dominion, and orcish metalwork traditions are respected.',
      gnome: 'Competitive. Gnomish engineering and dwarven craftsmanship represent fundamentally different philosophies — mass production versus artisanal excellence — and neither side concedes the other\'s superiority.',
      goblin: 'Tense. Goblin tunnel networks occasionally intersect dwarven holds, leading to territorial disputes managed carefully by both sides.',
      lizardfolk: 'Minimal contact. Underground and swamp civilizations rarely intersect.',
      catfolk: 'Amicable. Catfolk traders are the primary surface intermediaries for dwarven goods.'
    }
  },

  gnome: {
    name: 'Gnomes',
    title: 'The Collective',
    population: '~340,000',
    lifespan: '200-350 years',
    government: 'Industrial state governed by the Synthesis Council, a technocratic directorate',
    summary: 'The Gnomish Collective occupies the eastern archipelago of Fortuna, a chain of volcanic islands transformed into an industrial powerhouse. Gnomish society prizes innovation, efficiency, and collective achievement. The Collective has been withdrawing from continental affairs since Year 120, reducing trade, recalling diplomats, and fortifying their sea lanes. The reason, per leaked internal documents, is simple: the Dominion is a political structure built on a theological lie, that lie cannot survive contact with the Rift\'s true nature, and the Collective has no interest in being present when the collapse arrives. Phase Three — a contingency plan of unknown scope — is approaching activation.',
    culture: 'Gnomish culture prizes innovation and optimization. The Synthesis Council governs based on data rather than tradition or ideology. Gnomes are naturally curious, mechanically gifted, and slightly obsessive about process improvement. Beneath their cheerful industriousness lies a collective guilt about their contributions to Heaven\'s Atlas — gnomish precision instruments were used in the device\'s construction, and the Collective has never formally acknowledged this. The acknowledgment sits in sealed internal documents that the Collective\'s lawyers have kept precisely worded for four centuries.',
    homeland: 'The Eastern Isles — a volcanic archipelago roughly two weeks\' sail from the Fortuna coast. Heavily industrialized, with the capital Mechspire built into and around an extinct volcano.',
    notableTraits: [
      'Unmatched mechanical engineering — clockwork automata, precision instruments, and industrial machinery',
      'Naval supremacy in the eastern seas, with a fleet of ironclad warships',
      'Technocratic governance that is efficient but increasingly secretive',
      'Collective guilt over contributions to Heaven\'s Atlas that drives their withdrawal',
      'Phase Three contingency — an unknown plan that makes every other government on Fortuna nervous'
    ],
    relations: {
      human: 'Strained. The Dominion distrusts gnomish neutrality. Gnomes view the Dominion as a theocratic system in terminal decline.',
      elf: 'Guilt-ridden. Gnomish engineering contributed to Heaven\'s Atlas. The Collective has never formally acknowledged this.',
      orc: 'Minimal contact. Geographic distance and cultural differences limit interaction.',
      dwarf: 'Rival respect. Both races are master builders but hold opposing philosophies.',
      goblin: 'Suspicious. The Collective fears goblin espionage and maintains aggressive counter-intelligence operations.',
      lizardfolk: 'Interested. The Synthesis Council quietly funds lizardfolk astronomical research, which suggests they take celestial predictions more seriously than they publicly admit.',
      catfolk: 'Commercial. Catfolk merchants are among the few outsiders still permitted to trade at gnomish ports.'
    }
  },

  goblin: {
    name: 'Goblins',
    title: 'The Resistance',
    population: 'Unknown (estimated 50,000-200,000)',
    lifespan: '30-60 years',
    government: 'Decentralized cell structure with no central authority',
    summary: 'Goblins are Fortuna\'s survivors. Short-lived, small, and universally underestimated, they have maintained a decentralized resistance network spanning every nation on the continent for over five hundred years. Born from the extermination campaigns of the pre-war era, the goblin resistance evolved from desperate tunnel fighters into the most sophisticated intelligence apparatus on the continent. Every major city on Fortuna has goblin cells operating in its shadows. Their population is impossible to census because goblins are experts at not being counted.',
    culture: 'Goblin culture is shaped by precarity. With lifespans of 30-60 years and no homeland to call their own, goblins live with an urgency that longer-lived races find disorienting. Knowledge is passed down rapidly — a goblin apprentice must learn in five years what an elven student takes fifty to master. The cell structure provides security through compartmentalization. Goblins value cunning over strength, loyalty over honor, and survival over glory. Despite their reputation as vermin — a classification the Dominion has maintained in official documents for twelve hundred years — goblin communities are tightly bonded, with elaborate systems of mutual aid.',
    homeland: 'None. Goblins are found wherever other races build cities large enough to hide in. The closest thing to a goblin homeland is the tunnel network — a continent-spanning web of passages, caches, and safe houses that predates recorded history.',
    notableTraits: [
      'Five-hundred-year resistance network spanning every nation on Fortuna',
      'Expert intelligence operatives — surveillance, infiltration, forgery, sabotage',
      'Shortest lifespan of any race except catfolk, creating a culture of urgent knowledge transfer',
      'Continental tunnel network providing unmatched covert mobility',
      'Trap and demolition engineering that rivals gnomish precision in specialized applications'
    ],
    relations: {
      human: 'Adversarial. The Dominion classifies goblins as vermin and maintains standing bounties. Goblins respond with espionage and sabotage.',
      elf: 'Cooperative. Elven administrators and goblin intelligence operatives share a common interest in undermining Dominion overreach.',
      orc: 'Allied. The longest-standing inter-racial alliance on Fortuna, forged in mutual resistance.',
      dwarf: 'Tense. Tunnel-border disputes are common but neither side wants open conflict.',
      gnome: 'Hostile. The Collective actively hunts goblin spies.',
      lizardfolk: 'Respectful. Both organizations appreciate the value of information.',
      catfolk: 'Friendly. Catfolk gambling establishments serve as convenient meeting places for resistance cells.'
    }
  },

  lizardfolk: {
    name: 'Lizardfolk',
    title: 'The Sects',
    population: '~15,000 visible (true numbers unknown)',
    lifespan: '600-800 years',
    government: 'Decentralized knowledge sects, each specializing in a domain of study',
    summary: 'Lizardfolk are Fortuna\'s most enigmatic civilization. Organized into secretive knowledge sects — the most prominent being the Astronomy Sect — they observe, record, and predict without interfering. At least, that was their practice for millennia. The founding of the Veiled Hand in Year 1, by lizardfolk astronomers who had watched Calidar burn and their warnings go unread, marked a dramatic departure: having failed to prevent catastrophe through warning alone, they decided that direct intervention — including assassination — was sometimes necessary to prevent existential disaster. The Astronomy Sect\'s records contain the most complete account of Heaven\'s Atlas\'s true effects that exists anywhere on Fortuna, including the first written documentation that the Rift was not merely a side effect of the Atlas detonation but a divine punishment deliberately placed.',
    culture: 'Lizardfolk society is organized around the acquisition, preservation, and judicious application of knowledge. Each sect specializes in a domain — astronomy, herbalism, geology, history, linguistics — and maintains archives dating back thousands of years. Lizardfolk value observation over action, patience over haste, and accuracy over elegance. Their emotional expression is subtle by mammalian standards, leading other races to perceive them as cold or detached. In truth, lizardfolk experience emotion deeply but express it through shifts in scale coloration, body posture, and scent.',
    homeland: 'The Southern Marshlands of Fortuna — a vast wetland region south of the Dominion. Lizardfolk settlements are almost impossible to find without a guide. Some sects maintain outposts near Rift sites where astronomical observations are most productive.',
    notableTraits: [
      'Astronomy Sect predictions have proven accurate over thousands of years of recorded history — including the Atlas event',
      'Founded the Veiled Hand — the continent\'s premier assassination network',
      'True population and organizational structure are unknown to outsiders',
      'Extraordinary longevity combined with cultural emphasis on knowledge accumulation',
      'In possession of the only complete documented account of the lich\'s true identity and origin'
    ],
    relations: {
      human: 'Invisible. Most humans are unaware of lizardfolk civilization. The Astronomy Sect prefers it this way.',
      elf: 'Mutual respect between scholars. Elves are one of few races that credit lizardfolk predictions.',
      orc: 'Curious exchange. Orcish shamanic traditions and lizardfolk observational science find occasional common ground.',
      dwarf: 'Minimal. Underground and swamp civilizations rarely interact.',
      gnome: 'Quietly significant. The Collective funds lizardfolk research — a relationship both sides keep secret.',
      goblin: 'Information partners. Both networks trade intelligence when their interests align.',
      catfolk: 'Neutral. Catfolk caravans occasionally pass through lizardfolk territory without incident, which is itself remarkable.'
    }
  },

  catfolk: {
    name: 'Catfolk',
    title: 'The Diaspora',
    population: '~45,000',
    lifespan: '60-80 years',
    government: 'The Salt Court — a mobile merchant parliament that convenes at shifting locations',
    summary: 'The catfolk are a stateless people scattered across Fortuna\'s deserts, trade routes, and port cities. Their ancestral desert kingdoms collapsed as mana contamination from Calidar\'s destruction spread outward, desertifying their ancient oases. They have never reconstituted a homeland. Instead, catfolk have embraced their diaspora, building an identity around mobility, trade, and an elaborate gambling culture that serves as both entertainment and social bonding. The Salt Court — named for the commodity that once underpinned their economy — functions as a mobile governing body, convening at different locations to settle disputes and coordinate caravan routes.',
    culture: 'Catfolk culture is defined by movement. A catfolk who stays in one place too long is considered stagnant — a spiritual condition as much as a practical one. Gambling is not merely recreation but a cultural institution — contracts are sealed with dice rolls, disputes are settled by card games, and a catfolk\'s reputation is partly measured by their luck. Their short lifespans create a culture of immediacy — catfolk live intensely, form attachments quickly, and mourn briefly.',
    homeland: 'Formerly the Great Endless Desert and surrounding oases of Fortuna. Catfolk still maintain a presence in the desert, but their population is distributed across every major trade city on the continent.',
    notableTraits: [
      'Continental trade network rivaling goblin intelligence apparatus in reach',
      'Gambling culture that functions as social glue, dispute resolution, and spiritual practice',
      'Short lifespans creating a culture of intensity and immediate engagement',
      'Desert adaptation — heat resistance, low water requirements, excellent night vision',
      'The Salt Court provides governance without territory, a unique political innovation'
    ],
    relations: {
      human: 'Pragmatic. Catfolk traders are welcome in Dominion markets, and their gambling houses are popular despite being technically illegal.',
      elf: 'Grateful. Catfolk caravans aided elven refugees after Year 0, establishing a bond that endures across centuries.',
      orc: 'Friendly. Desert-steppe border communities mix freely.',
      dwarf: 'Commercially vital. Catfolk are the primary surface distributors of dwarven goods.',
      gnome: 'Useful. Catfolk merchants are among the few outsiders still trading at gnomish ports.',
      goblin: 'Sympathetic. Both stateless peoples understand the value of networks over territory.',
      lizardfolk: 'Neutral passage. Catfolk caravans traverse lizardfolk territory without conflict — a courtesy extended to few others.'
    }
  },
};


// ---------------------------------------------------------------------------
// FACTION LORE
// ---------------------------------------------------------------------------

const FACTION_LORE = {
  adventure_guild: {
    name: 'The Adventure Guild',
    founded: 'Year 450',
    leader: 'The Guild Council — a rotating body of retired Relic-rank adventurers',
    summary: 'The Adventure Guild is Fortuna\'s primary institution for Rift containment, exploration, and the regulation of adventuring activity. Founded by a coalition of veteran Rift fighters who recognized that ad hoc responses to dimensional incursions were unsustainable, the Guild provides structure, training, equipment, and legal authority to adventurers of all races. Its ten-rank progression system incentivizes skill development and risk management. Guild towns, established near major Rift concentrations, serve as neutral ground where racial tensions are subordinated to the shared imperative of survival. The Dominion views the Guild\'s growing influence with alarm. Every other race views it as the only institution that has asked them to participate rather than submit.',
    purpose: 'Rift containment, adventurer regulation, inter-racial cooperation, threat assessment and response',
    ranks: ['Stone', 'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Mythril', 'Adamantine', 'Relic'],
    headquarters: 'The First Hall — the original Guild building near the primary Rift site, expanded over decades into a sprawling campus of training grounds, archives, quartermaster stores, and administrative offices. Regional headquarters exist in each of the ten anchor towns.',
    notableDetails: 'Guild law supersedes national law within designated Rift zones and Guild town boundaries. This extraterritorial authority, granted by the Compact, is the Guild\'s most politically contentious feature. The Dominion views it as an infringement on Helios\'s divine mandate to govern Fortuna. Every other race views it as a miracle. The Guild\'s internal research division has been accumulating evidence about the lich\'s true nature — the soldier who carried the Atlas, punished by a Dark Elven god, trapped in the Rift for five centuries — and has not yet decided what to do with that information.'
  },

  holy_dominion: {
    name: 'The Holy Dominion',
    founded: 'Year -3800 (Pre-War Era)',
    leader: 'Prophet-King Aldren III and the Council of Cardinals',
    summary: 'The Holy Dominion is the continent\'s largest and most powerful nation — a theocratic empire spanning the central plains of Fortuna, governed by the Prophet-King and his Council of Cardinals. The Dominion\'s power rests on three pillars: a massive population, a professional military, and the Helios Doctrine — the religious conviction that humanity\'s demi-god Helios is the chief deity of all peoples and that humanity is divinely mandated to govern them. The Dominion deployed Heaven\'s Atlas in Year 0, ending the Calidar civilization and the elven homeland in a single hour. This act haunts the empire\'s identity. Below Solara, sealed in vaults beneath the Cathedral of the Chosen, Helios himself is imprisoned — alive, barely conscious, his divine essence siphoned continuously to power imperial artifacts. The Cardinals know. The Prophet-King knows. The common faithful do not.',
    purpose: 'Governance of human territories, enforcement of the Doctrine, maintenance of continental order through military and religious authority',
    ranks: ['Citizen', 'Faithful', 'Deacon', 'Prelate', 'Bishop', 'Archbishop', 'Cardinal', 'Prophet-King'],
    headquarters: 'The Cathedral of the Chosen in Solara — a massive structure of white marble and stained glass that serves as both the seat of government and the holiest site in Dominion theology. The vaults below it have not been officially inspected by an independent authority in five hundred years.',
    notableDetails: 'The Dominion\'s enforcement arm for magic — the Luminary Inquest — maintains execution authority over unlicensed magic users. This authority is exercised regularly. The Magic Ban technically exists to prevent another Atlas event. In practice, it exists to ensure that no race can develop magical capability sufficient to challenge Dominion supremacy. The lich\'s increasing activity is presenting the Dominion with a crisis of theological narrative: the entity in the Rift is clearly connected to the Atlas event, clearly more powerful than anything the Inquest can contain, and clearly not behaving like Helios\'s divine judgment should behave.'
  },

  luminary_inquest: {
    name: 'The Luminary Inquest',
    founded: 'Year 1',
    leader: 'The Grand Luminary — currently Inquisitor-Marshal Seraphine Voss (human, age 61)',
    summary: 'The Luminary Inquest is the continental authority responsible for enforcing the Magic Ban — the sweeping prohibition on unlicensed sorcery enacted after Year 0. Inquest agents, known as Luminaries, have the legal authority to investigate, detain, and execute unlicensed magic users. They maintain documentation checkpoints at major cities and border crossings. The Inquest\'s cross-border jurisdiction, granted by the Compact, means no single nation can revoke their authority. Their relationship with the Adventure Guild is tense — Guild Rift operations require magic use that technically violates Inquest regulations, creating a legal gray zone both institutions navigate carefully. The Inquest\'s classified records contain evidence they have not published: that the lich is not a random monster but a specific individual whose identity, if known, would raise questions about the entire theological foundation of the Dominion.',
    purpose: 'Enforcement of the Magic Ban, documentation and regulation of licensed magic users, investigation of magical crimes and unauthorized sorcery',
    ranks: ['Initiate', 'Agent', 'Senior Agent', 'Inspector', 'Senior Inspector', 'Inquisitor', 'Inquisitor-Marshal', 'Grand Luminary'],
    headquarters: 'The Spire of Clarity in Solara — a tower of enchanted crystal that functions as a mana detection array, capable of sensing large-scale magical activity across hundreds of miles.',
    notableDetails: 'The Inquest\'s execution authority is its most controversial power and is exercised regularly in the current climate of rising rift activity. Unlicensed magic users found outside the Rift are arrested, tried in closed proceedings, and either executed or conscripted into classified research programs. The Inquest maintains extensive files on every registered magic user on Fortuna. A moderate internal faction has existed since Year 300, arguing that enforcement scope has expanded beyond the original mandate. This faction is surveilled by the loyalist majority.'
  },

  veiled_hand: {
    name: 'The Veiled Hand',
    founded: 'Year 1',
    leader: 'Unknown — the organization\'s leadership structure is compartmentalized beyond outside comprehension',
    summary: 'The Veiled Hand is an assassination network founded by surviving lizardfolk astronomers in the immediate aftermath of Year 0. Its purpose is anti-escalation: the Veiled Hand identifies and eliminates individuals, projects, or organizations that threaten to accumulate enough power to cause another Calidar-scale catastrophe. The Hand operates through deep-cover agents embedded in every major institution on Fortuna, activated only when celestial predictions indicate imminent existential risk. The Astronomy Sect\'s records — which the Veiled Hand has access to — indicate that the lich is not an existential threat in the traditional sense. He is a symptom. The disease is the Rift\'s widening. The disease is five centuries of siphoning Helios\'s divine essence to power imperial artifacts. The disease is what happens when a world breaks a god and never acknowledges it. The Veiled Hand is trying to decide what role it can play in a situation where the threat is not one person but an entire structure of power.',
    purpose: 'Prevention of existential-scale catastrophes through targeted elimination of threats before they mature',
    ranks: ['Unknown — the Veiled Hand does not use formal ranks visible to outsiders'],
    headquarters: 'None known. The organization operates through dead drops, coded markers, and face-to-face meetings at locations determined by astronomical calendars.',
    notableDetails: 'The Veiled Hand has access to the Astronomy Sect\'s complete records on the lich\'s origin — including the documentation that he is the Dominion warrior who deployed the Atlas, that the Dark Elven god placed the punishment artifact in his chest, and that he has been sending slivers of himself outward in an attempt to communicate with Helios. The Hand has not shared this intelligence with the Adventure Guild. They are still assessing whether sharing it would stabilize the situation or accelerate the collapse.'
  },

  free_holds: {
    name: 'Free Holds of Stone',
    founded: 'Year -4200 (Pre-War Era)',
    leader: 'No single leader — governed by inter-hold syndicate councils with rotating facilitators',
    summary: 'The Free Holds of Stone are the dwarven labor federation — a network of autonomous underground holds connected by tunnels through the western mountains of Fortuna. Each hold is self-governing, organized around worker-owned syndicates. There are no monarchs, no aristocrats, and no inherited positions of authority. The Free Holds have maintained this anarcho-syndicalist structure for over four thousand years, making it the oldest continuously functioning political system on Fortuna. Their isolationism is legendary. The Helios Doctrine was rejected formally in Year -600 on the grounds that it constituted an external power claiming theological authority over internal affairs. The Free Holds have not updated this position.',
    purpose: 'Self-governance of dwarven holds, collective management of underground resources, preservation of dwarven craft traditions and political independence',
    ranks: ['Apprentice', 'Journeyworker', 'Craftsperson', 'Master Artisan', 'Syndicate Delegate', 'Hold Facilitator', 'Inter-Hold Delegate'],
    headquarters: 'No central capital. The largest hold, Deepforge, hosts inter-hold councils by tradition but claims no authority over other holds. Ironhold serves as the primary interface with the surface world.',
    notableDetails: 'The dwarven military capability is often underestimated because the Free Holds rarely project force beyond their mountain borders. In truth, the holds maintain formidable tunnel-fighting forces and engineering capabilities — including siege engines and explosive charges — that could threaten any surface army foolish enough to enter dwarven territory. The Dominion learned this lesson during a punitive expedition centuries ago that annihilated against coordinated tunnel collapses and ambushes. The official record of that expedition was reclassified as "a training exercise with unexpectedly high attrition."'
  },

  khanate: {
    name: 'The Khanate (Fragmented)',
    founded: 'Year -2500 (Pre-War Era)',
    leader: 'None — the position of Great Khan has been vacant since Year -45. Clan chiefs govern independently.',
    summary: 'The Orcish Khanate was once a unified nomadic confederation spanning the northern steppes of Fortuna, governed by the Great Khan and the clan-moot system. Since the death of Great Khan Morghul in Year -45, the Khanate has been fragmented into competing clan alliances with no central authority. The Dominion\'s suppression campaigns of Year 400 further shattered orcish territorial integrity, banning cultural practices and seizing sacred lands. Despite this fragmentation, the ideal of the Khanate persists — orcish identity is defined by clan loyalty, mounted tradition, and the memory of unity. Multiple clans claim the right to name a new Great Khan, but none has achieved sufficient consensus to unite the moot.',
    purpose: 'Preservation of orcish autonomy, protection of clan territories, maintenance of nomadic traditions and cultural identity',
    ranks: ['Unblooded', 'Rider', 'Blade', 'War-Leader', 'Clan Chief', 'Moot-Speaker', 'Great Khan (vacant)'],
    headquarters: 'No permanent capital. The traditional gathering point for the full clan-moot is the Bone Fields — a vast plain in the central steppes where the Last World War\'s largest battles were fought. Clan chiefs convene there during the summer solstice, though full attendance has not occurred since Morghul\'s death.',
    notableDetails: 'Orcish mounted warriors remain among the most effective light cavalry on Fortuna. The Khan\'s death left the succession clause in his legal code unfinished mid-sentence. Without it, no new Khan can be legitimately named under the legal code every orc recognizes. The Veiled Hand is believed to have had a role in ensuring that unfinished clause remained unfinished — on the grounds that a unified Khanate would have presented the Dominion with an existential military threat, likely triggering another Atlas deployment. This is the Veiled Hand\'s most controversial and least acknowledged operation.'
  },

  gnomish_collective: {
    name: 'The Gnomish Collective',
    founded: 'Year -3100 (Pre-War Era)',
    leader: 'The Synthesis Council — a technocratic directorate of twelve senior engineers',
    summary: 'The Gnomish Collective is the industrial state occupying the eastern archipelago of Fortuna. Governed by the Synthesis Council, the Collective has transformed its volcanic islands into a manufacturing powerhouse. Since Year 120, the Collective has been systematically withdrawing from Fortuna\'s continental affairs, reducing trade, fortifying its sea lanes, and conducting classified research projects. Phase Three — a contingency plan whose full scope is unknown to outsiders — appears to be approaching activation as of Year 500.',
    purpose: 'Industrial production, technological advancement, defense of gnomish territorial sovereignty, execution of long-term strategic contingencies',
    ranks: ['Apprentice', 'Technician', 'Engineer', 'Senior Engineer', 'Lead Engineer', 'Director', 'Synthesis Council Member'],
    headquarters: 'Mechspire — the Collective\'s capital, built into and around an extinct volcano on the largest island.',
    notableDetails: 'The Collective maintains the second-largest navy on Fortuna and the most technologically advanced. Phase Three is believed by analysts to be either a defensive superweapon, a mass evacuation plan, or a response to something the Collective detected in the rift energy signatures that they have not shared with any other government. The gnomish Survey Station network watches specifically for Heaven\'s Atlas-scale energetic signatures. Whether they have found what they were watching for is not publicly known.'
  },

  shadow_fen_commune: {
    name: 'The Shadow Fen Commune',
    founded: 'Year 250 (approximately)',
    leader: 'The Circle — a rotating council of seven elected representatives, one from each major community within the Fen',
    summary: 'The Shadow Fen Commune is a refugee settlement in the southwestern swamplands of Fortuna, home to outcasts, dissidents, fugitives, and survivors from every race. Protected by treacherous terrain and the Veil — a natural mana anomaly that renders the swamp resistant to Inquest scrying — the Commune has grown into a functioning multi-racial society governed by direct democracy and a commitment to non-extradition.',
    purpose: 'Providing sanctuary for those with nowhere else to go, maintaining the Veil, demonstrating that multi-racial cooperation is possible without institutional hierarchy',
    ranks: ['Newcomer', 'Resident', 'Citizen', 'Council Candidate', 'Circle Member'],
    headquarters: 'The Roots — a settlement built on and around the massive root systems of ancient swamp trees. Buildings are constructed on stilts, connected by rope bridges, and concealed by the canopy.',
    notableDetails: 'The Veil is the Commune\'s primary defense — a natural mana anomaly inherent to the swamp\'s ancient magical substrate, which disrupts scrying, tracking, and divination within its boundaries. The Commune is one of the few places on Fortuna where a human, an orc, a goblin, and an elf can sit at the same table without attracting institutional attention. It is also one of the few places where the name "Calidar" is spoken aloud rather than coded.'
  },
};


// ---------------------------------------------------------------------------
// GEOGRAPHY
// ---------------------------------------------------------------------------

const GEOGRAPHY = [
  {
    id: 'fortuna',
    name: 'Fortuna — The Enlightened Continent',
    terrain: 'Varied continent: central plains, western mountains, northern steppes, southern marshlands, eastern archipelago',
    description: 'Fortuna is what the Holy Dominion calls the Enlightened Continent — though this name was chosen by the Dominion and accepted by precisely no one else. It is a continent of extraordinary geographic diversity: fertile central plains, rugged western mountain ranges riddled with dwarven holds, vast northern steppes where orcish clans have migrated for millennia, southern marshlands where lizardfolk sects observe the heavens, and the eastern archipelago where the gnomish Collective has built its industrial empire. For five thousand years, nine peoples shared this continent in various states of tension and coexistence. For five hundred years, the rift torn open at the heart of the Holy Dominion\'s capital has been the continent\'s defining wound.'
  },
  {
    id: 'holy_dominion_lands',
    name: 'The Holy Dominion',
    terrain: 'Central plains, rolling farmland, fortified cities',
    description: 'The heartland of human civilization on Fortuna — a vast expanse of fertile plains stretching from the western mountains to the eastern coast. Cathedral-cities dot the landscape, their white spires visible for miles across flat terrain. The empire\'s infrastructure is the best on the continent. Beneath the orderly surface, tensions simmer: between reformists and traditionalists in the Church, between human citizens and elven administrators, and between the official theology and the sealed vaults below the capital where the truth about Helios is locked away.'
  },
  {
    id: 'wastes_of_calidar',
    name: 'The Wastes of Calidar',
    terrain: 'Sickly green glass plains, hot ash, fluctuating magma pools',
    description: 'Once the most beautiful place on Fortuna: a desert oasis where marble colonnades and obsidian towers rose from cultivated gardens, the joint capital of the Elven and Dark Elven peoples, a city of five hundred years\' worth of accumulated scholarship and artistry. Now it is fifty miles of sickly green glass — the signature hue of Heaven\'s Atlas\'s divine-organic energy. The magma still fluctuates. The ash still drifts. Nothing grows in the Wastes, and what pools there is lethally contaminated with residual divine essence. The Adventure Guild maintains observation posts on the crater rim but forbids unauthorized entry. Every elf alive carries this place in cultural memory. The last Dark Elves carry it more personally still.'
  },
  {
    id: 'northern_steppes',
    name: 'The Northern Steppes',
    terrain: 'Vast grasslands, seasonal rivers, scattered rock formations',
    description: 'An enormous expanse of grassland stretching from the Dominion\'s northern border to the Frostbound Reach. The steppes are orcish territory — or were, before the suppression campaigns of Year 400 shrank clan ranges to a fraction of their historical extent. Dominion garrison towns dot the southern steppes, their presence a constant reminder of imperial overreach. Further north, beyond the garrison line, the land belongs to the clans and the wind.'
  },
  {
    id: 'western_mountains',
    name: 'The Western Mountains',
    terrain: 'Mountain ranges, underground hold networks, alpine valleys',
    description: 'A formidable range of peaks that forms Fortuna\'s western spine. Above ground, the mountains are steep and snow-capped. Below, the dwarven Free Holds extend for miles — vast caverns repurposed as workshops, living quarters, fungal farms, and geothermal power plants. The mountains are riddled with tunnels, not all of them dwarven; goblin warrens, natural cave systems, and collapsed pre-war fortifications create a three-dimensional maze that no surface map can capture. Ironhold, the primary surface trade town, sits at a mountain pass.'
  },
  {
    id: 'eastern_isles',
    name: 'The Eastern Isles',
    terrain: 'Volcanic archipelago, industrial coastlines, deep harbors',
    description: 'A chain of volcanic islands roughly two weeks\' sail from the Fortuna coast, home to the Gnomish Collective. The islands are a study in contrasts — lush volcanic slopes give way abruptly to industrial zones of factories, shipyards, and clockwork infrastructure. The harbors are deep enough to accommodate the Collective\'s ironclad fleet. The interior of the largest island is dominated by Mechspire, the capital. Access is strictly controlled.'
  },
  {
    id: 'shadow_fen',
    name: 'The Shadow Fen',
    terrain: 'Swampland, ancient forests, fog-shrouded wetlands',
    description: 'A vast swamp in Fortuna\'s southwest, perpetually shrouded in supernatural fog. The Fen is home to the Shadow Fen Commune and is protected by the Veil — a magical anomaly that disrupts tracking, scrying, and navigation. The terrain is treacherous: quicksand, toxic plants, aggressive wildlife, and the ever-present fog make travel without a guide suicidal. Those who know the paths find a surprisingly rich ecosystem.'
  },
  {
    id: 'great_endless_desert',
    name: 'The Great Endless Desert',
    terrain: 'Sand dunes, rocky badlands, scattered oases',
    description: 'A vast desert stretching across Fortuna\'s eastern interior, traditionally home to catfolk caravan routes. Oases serve as waypoints for caravans, governed by complex water-sharing agreements enforced by the Salt Court. The desert\'s edges blend into scrubland where catfolk-orcish trading posts serve both peoples. Deep in the desert, ancient ruins surface from the shifting sands — some predating even elven records, their origins unknown.'
  },
  {
    id: 'scorched_sands',
    name: 'The Scorched Sands',
    terrain: 'Superheated desert, glass formations, thermal vents',
    description: 'The most inhospitable region of the Great Endless Desert on Fortuna, where surface temperatures can melt metal and the sand has fused into vast plains of natural glass — a landscape that bears an unsettling resemblance to what the Wastes of Calidar became after the Atlas detonation, though for entirely natural reasons. The Scorched Sands are sacred to catfolk culture — pilgrims journey there to test themselves against the elements as a rite of passage. Rare minerals prized by alchemists and enchanters make harvesting there a dangerous but lucrative industry.'
  },
  {
    id: 'frostbound_reach',
    name: 'The Frostbound Reach',
    terrain: 'Tundra, permafrost, glaciers, frozen seas',
    description: 'Fortuna\'s frozen north, where winter lasts nine months. The Reach is home to displaced orcish clans driven north by Dominion suppression, as well as hardy wildlife and occasional Rift manifestations that are particularly dangerous in the cold. The few permanent settlements are built around geothermal springs. Orc clans in the Reach have developed a fatalistic relationship with the Rift — they have been living near impossible cold for so long that one more impossible thing barely registers.'
  },
  {
    id: 'southern_marshlands',
    name: 'The Southern Marshlands',
    terrain: 'Wetlands, mangrove forests, river deltas',
    description: 'A network of swamps, marshes, and river deltas south of the Dominion on Fortuna, bordering the Wastes of Calidar. The marshlands are lizardfolk territory. Their settlements are hidden so effectively that explorers can pass within yards without noticing. The proximity to the Wastes means that Rift activity is relatively common, and lizardfolk sects maintain careful observation posts at the boundary where the green-glass waste ends and the living swamp begins.'
  },
  {
    id: 'elven_south',
    name: 'The Elven South',
    terrain: 'Ancient forests, coastal cliffs, ruined cities',
    description: 'The southern coastal region of Fortuna that once supported the outer territories of the elven civilization — the communities that existed beyond Calidar\'s walls, that survived the Atlas event because they were not in the city when it detonated. The forests are dense and ancient, shaped by centuries of elven cultivation. Small elven communities persist here, maintaining presence near their lost homeland despite the danger from the Wastes. The Dominion claims sovereignty over the region but exercises minimal control beyond the major roads.'
  },
  {
    id: 'the_primary_rift',
    name: 'The Primary Rift',
    terrain: 'A spatial tear in the floor of the Cathedral District, Solara — growing slowly outward across five centuries',
    description: 'The original Rift: a spatial tear created at the epicenter of Heaven\'s Atlas\'s detonation in Calidar, then deliberately moved by the Dark Elven god who served as its architect — placed in the old human capital as punishment and monument, a wound at the heart of the civilization that caused it. The Rift sits in the southeastern boundary of the Cathedral District in Solara, beneath iron grating and Inquest guard posts. Its surface expression has grown from roughly three meters in Year 75 to its current extent: a gaping tear twelve meters wide and growing. Through it, the floors of an infinite shifting labyrinth are visible, populated by hollow things that wear the shapes of living races without inhabiting them. Inside the Rift, time moves differently. A day outside can be a decade within. Something has been inside it for five hundred years, and for five hundred years it has been trying to get out by tearing the world apart at its seams. The secondary rifts appearing in smaller towns across Fortuna are evidence of its progress.'
  },
];


// ---------------------------------------------------------------------------
// RANDOM FACTS — for loading screens, NPC dialogue, flavor text
// ---------------------------------------------------------------------------

const RANDOM_FACTS = [
  'The Rift reseeds at midnight. No two days produce the same configuration of floors.',
  'Dwarven master smiths sign their work with a unique hammer-mark. Collectors pay fortunes to identify the maker of antique pieces.',
  'The Magic Ban technically prohibits healing magic above a certain threshold. In practice, Inquest agents look the other way at hospitals.',
  'Catfolk gambling houses use a 60-card deck called the Salt Deck. The suits are Sand, Wind, Star, and Bone.',
  'Orcish epic poetry can take up to three days to recite in full. Interrupting a recitation is considered a declaration of hostility.',
  'The gnomish language contains 347 distinct words for different types of gears, but only one word for "vacation."',
  'Goblin tunnel networks predate recorded history. Even goblins do not know who dug the oldest passages on Fortuna.',
  'The Veiled Hand has never publicly claimed responsibility for an assassination. Attribution is always speculative.',
  'Lizardfolk can remain motionless for up to 72 hours. Their ambush predation instinct translates directly into their espionage technique.',
  'Guild town taverns are required to serve food and drink from at least three different racial cuisines.',
  'The Prophet-King has not been seen in public for several years. Official portraits are updated annually by court painters working from descriptions.',
  'Dwarven beer is brewed with underground mushrooms and geothermal spring water. Surface imitations never taste quite right.',
  'Elven administrators can recall every document they have ever processed, word for word. This makes them invaluable — and dangerous.',
  'The Great Endless Desert of Fortuna contains ruins that predate all known civilizations. Their builders remain unidentified.',
  'Catfolk believe that dice remember who rolled them. A seasoned set of dice is considered more reliable than a new one.',
  'The Luminary Inquest maintains files on every registered magic user on Fortuna. The files are updated quarterly.',
  'Orcish warhorses bond with their rider for life. A horse that outlives its rider will refuse to accept another.',
  'Shadow Fen mushroom tea is mildly hallucinogenic and extremely popular with visiting adventurers. The Commune sells it at a markup.',
  'The First Guild Hall still contains the original notice board, now protected behind glass as a historical artifact.',
  'Gnomish clockwork toys are the most popular children\'s gift on Fortuna, despite the Collective\'s trade restrictions.',
  'The Astronomy Sect has predicted every major Rift event with at least one year of advance warning. Their methods remain secret.',
  'Salt Court sessions begin and end with a ritual dice roll. If the closing roll matches the opening roll, decisions are considered especially auspicious.',
  'Dwarven holds communicate via a system of acoustic tubes carved through the mountain. Messages travel faster than mounted couriers.',
  'The Magic Ban exempts agricultural magic, leading to a legal gray area around combat herbalism.',
  'Goblin resistance cells change their code phrases every three days. The scheduling system has never been compromised.',
  'Heaven\'s Atlas glowed sickly green and burned to the touch. Anyone who asks why is given an official non-answer by the Inquest.',
  'The Crimson Rift Incident, which nearly destroyed a major city, prompted the First Compact between six races. The Dominion attended as an observer.',
  'Catfolk caravans follow routes that have been used continuously for over three thousand years on Fortuna.',
  'Elven funeral rites involve planting a tree in memory of the deceased. No elves have planted one for Calidar because there is nowhere suitable near the Wastes.',
  'The Adventure Guild\'s postal service has a 97% delivery success rate, the highest on Fortuna.',
  'Orcish clan totems are carved from the bones of the clan\'s founding ancestor\'s mount. Some totems are over two thousand years old.',
  'Gnomish ironclads run on compressed volcanic gas. The fuel is the primary reason the Collective guards its volcanic islands so fiercely.',
  'The Veil surrounding Shadow Fen causes compasses to spin randomly. Navigation requires memorized landmarks and stellar observation.',
  'Lizardfolk blood is cold. This is not a metaphor — they are ectothermic and require external heat sources to maintain activity.',
  'Guild rank badges are forged from a unique alloy that changes color under magical examination, making counterfeiting nearly impossible.',
  'Catfolk night vision is sharp enough to read by starlight. Most catfolk consider torches unnecessary and slightly insulting.',
  'The Luminary Inquest was originally a temporary commission. Its temporary mandate has been renewed every decade for five hundred years.',
  'Orcish cooking uses a technique called ember-smoking that involves burying food in hot coals for up to twelve hours.',
  'The oldest known map of the goblin tunnel network, confiscated by the Inquest, proved to be deliberately inaccurate.',
  'Dwarven holds hold referendums on major decisions. Voting is compulsory and conducted by placing carved tokens in sealed urns.',
  'Elven memory-wine, brewed with specific aromatic compounds, can trigger vivid recollections of specific events when consumed.',
  'The Adventure Guild\'s casualty rate has increased 40% in the last ten years, driven by rising Rift intensity.',
  'Gnomish engineers measure precision in "ticks" — a unit so small that surface races have no practical use for it.',
  'The Salt Court has never met in the same location twice. Meeting sites are chosen by a complex algorithm involving trade route intersections and lunar phases.',
  'Goblin trap-makers are respected even by dwarven engineers, who consider goblin mechanical instincts to be the closest thing to dwarven craft talent found on the surface.',
  'The Scorched Sands contain naturally occurring glass lenses that catfolk grind into optical instruments rivaling gnomish precision.',
  'Lizardfolk sects communicate using scent markers that remain detectable for decades. Their messages are literally written on the wind.',
  'The Rift Compact grants the Adventure Guild the authority to conscript local militias during a Rift emergency. This power has been exercised twice.',
  'Human cathedral-cities are designed so that every street leads eventually to the central cathedral. Getting lost always means finding the Church.',
  'The Adventure Guild maintains a lost-and-found vault containing artifacts too dangerous to sell and too valuable to destroy. Access requires Adamantine rank.',
  'Orcish funeral rites involve placing the deceased on a pyre on the open steppe, so that their spirit can ride the smoke to the sky.',
  'Dwarven children spend their first decade underground without ever seeing the sky. The first sunrise is a rite of passage called the Brightening.',
  'Gnomish clockwork automata can operate independently for up to 72 hours before requiring winding. Military models can operate for a week.',
  'The Luminary Inquest uses enchanted ink that glows under specific light spectra to authenticate official documents. Forgery is punishable by death.',
  'Catfolk caravans carry portable gambling tables that fold out from specialized wagons. A caravan without a gaming table is considered unlucky.',
  'Lizardfolk shed their skin every fifty years. The shed skin is used in ritual divination — the patterns are believed to encode the shedder\'s future.',
  'Goblin demolitions experts are called "sparks." The average career span of a spark is seven years, which goblins consider a respectably long time.',
  'Guild town taverns display a ranking board showing the highest-ranked adventurers currently in town. Getting your name on the board is a point of pride.',
  'The Wastes of Calidar are the most thoroughly documented uninhabitable zone on Fortuna. Every expedition that survives produces detailed notes. None recommend a return visit.',
  'The Rift\'s sickly green luminescence at depth matches the color of Heaven\'s Atlas almost exactly. The Inquest\'s official position is that this is coincidental.',
  'Dark Elves, per the Dominion\'s official historical record, do not exist. Per every other surviving record, they also do not exist. The Dominion was thorough about this one thing.',
  'The Helios Doctrine claims Helios is the supreme deity. It does not explain why prayers to Helios have been returning empty for several decades.',
  'Orcish horseshoes are forged with a distinctive double-ridge pattern that leaves tracks recognizable to any tracker on Fortuna.',
  'The Shadow Fen Commune has no written laws. Disputes are resolved by the Circle through mediation, and persistent troublemakers are simply asked to leave.',
  'The creatures inside the Rift wear familiar faces — orcish, elven, human — but their eyes are empty. No scholar has found a word for what they are. "Hollow" has started to appear in Guild field reports.',
  'The Rift\'s inhabitants sometimes shift species mid-movement: orcish one step, lizardfolk the next, human the step after. They appear unaware of the change. Whatever animates them does not identify with the shape it wears.',
  'Guild researchers who have spent extended time on deep Rift floors report that time felt wrong inside — not slow or fast, but wrong. Days felt like decades. Some returned having aged beyond what their surface-time absence should allow.',
  'The entity inside the Rift is not looking for victims. He is looking for Helios. This information is held by three institutions, shared by none of them, and would reshape the continent\'s politics if published.',
  'Heaven\'s Atlas contained one of Helios\'s own organs. The Dominion understood what this meant and deployed it anyway. The Cardinals who authorized the deployment are not in any official record.',
  'Five divine fragments are embedded in the soldier\'s body — one in each limb, one in his head. They are why he cannot die. They are also why every lich stronghold his sliver-selves create carries a faint warmth that no ordinary necromantic construct produces.',
  'The Dark Elven god who placed the punishment is not reachable. It departed when the souls were retrieved. The soldier has been calling into a silence that has lasted five hundred years.',
  'The Vel\'sharath were not heretics. The empire called them heretics to justify burning them. The distinction matters to the dead.',
  'There were two movements in Calidar before the Atlas came: the Vel\'sharath, who were seeking the absent gods, and the Reclamation Sect, who were petitioning their gods to punish humans. The Atlas killed both.',
];


// ---------------------------------------------------------------------------
// REGIONAL RUMORS — tied to anchor town zone IDs and wilderness areas
// ---------------------------------------------------------------------------

const REGIONAL_RUMORS = [
  // starter_town
  { regionId: 'starter_town', text: 'They say the First Guild Hall was built on the site of a pre-war battlefield. Sometimes, at night, you can hear metal clashing beneath the floorboards.' },
  { regionId: 'starter_town', text: 'The new rift that opened near town — it pulses with that green light. The same green as the old descriptions of the Atlas. Nobody official is saying this out loud.' },
  { regionId: 'starter_town', text: 'The tavern keeper used to be Gold-rank before she lost her arm. She doesn\'t talk about what happened in the Rift that took it, but she keeps a jar of green glass on the shelf behind the bar.' },
  { regionId: 'starter_town', text: 'A Stone-rank adventurer came back from the new rift speaking in a language nobody recognized. The Inquest took him for questioning three days ago. He hasn\'t been seen since.' },

  // solara
  { regionId: 'solara', text: 'The Prophet-King hasn\'t been seen in years. Some say he\'s praying in seclusion. Others say the Cardinals are running things and the throne sits empty. A third group says he went into the vaults below the Cathedral and didn\'t come back up.' },
  { regionId: 'solara', text: 'A Luminary Inquest agent was found dead near the Cathedral district. The official report says natural causes. She was thirty-two years old and had just filed a request for access to the restricted theological archives.' },
  { regionId: 'solara', text: 'The elven quarter in Solara has been expanding quietly for decades. The Administration is buying property through intermediaries. Nobody at the Cathedral seems concerned, which is itself concerning.' },
  { regionId: 'solara', text: 'Prayers to Helios have been returning empty for a long time — no warmth, no presence, no divine resonance. The clergy are told this is a test of faith. The ones who ask too many questions get reassigned.' },

  // sylvaris
  { regionId: 'sylvaris', text: 'The memorial trees in the Sylvaris groves are blooming out of season. Elven botanists say it\'s never happened before. The Ancient Ones say it happened once before — in the last year before the Atlas.' },
  { regionId: 'sylvaris', text: 'An Ancient One passed through Sylvaris last month — one of the elves who actually remembers Calidar as it was. She spent three days staring at the Wastes from the observation tower and left without speaking to anyone. On the fourth day, a sealed document appeared in the archivist\'s office with no courier record.' },
  { regionId: 'sylvaris', text: 'Traders from the south report new Rift activity near the Calidar Wastes rim. Not the usual shimmer-and-close kind — these are staying open for days, and the interior glows green.' },
  { regionId: 'sylvaris', text: 'Someone has been accessing the sealed Dark Elven linguistic archives at night. The access logs show the correct clearance code, but no one with that clearance admits to being there.' },

  // ironhold
  { regionId: 'ironhold', text: 'The dwarves have been buying Rift-harvested crystalline ore at triple the market rate. Whatever they\'re building down there, they need materials that don\'t exist in their mountains.' },
  { regionId: 'ironhold', text: 'A surface merchant tried to cheat a dwarven syndicate on a steel shipment. He was barred from every hold on Fortuna within a week. The dwarves don\'t have kings, but they have a blacklist.' },
  { regionId: 'ironhold', text: 'Tunnelers in the Third Deep broke into something ancient last month — not a natural cavern, not goblin-made. Something else entirely. The syndicate sealed it and isn\'t talking. The tunnelers who went in first don\'t work underground anymore.' },

  // kragmor
  { regionId: 'kragmor', text: 'Three clans arrived at Kragmor for the summer gathering, and none of them would speak to each other. The Khan-succession dispute is getting worse, but so is the lich activity near the northern passes. Both problems are getting harder to ignore.' },
  { regionId: 'kragmor', text: 'An orcish elder claims she saw a vision of the Great Khan Morghul\'s spirit riding across the steppe — toward the Rift, not away from it. The young warriors want to follow it. The elders say it\'s a Rift echo. Nobody is sure which would be worse.' },
  { regionId: 'kragmor', text: 'Dominion patrol numbers on the steppe have doubled in the last year. The garrisons are reinforcing, but nobody will say why. Orcs are nervous. They remember the last time Dominion reinforcements arrived quietly.' },

  // bonetrap
  { regionId: 'bonetrap', text: 'Goblin engineers have been seen entering the old war tunnels beneath Bonetrap. Those tunnels were supposed to be collapsed and sealed centuries ago. Something in them is still warm.' },
  { regionId: 'bonetrap', text: 'A resistance cell was raided by the Inquest last month. They found forged identity papers good enough to fool a Cardinal\'s checkpoint, and a partial map of the Cathedral district\'s sub-basement that no public document acknowledges exists.' },
  { regionId: 'bonetrap', text: 'Something is killing rats in the Bonetrap undercity. Rats. Whatever\'s down there is either very small, very specific, or is making something that used to be a rat into something else.' },

  // murkmire
  { regionId: 'murkmire', text: 'The Veil around Shadow Fen flickered last week — just for a moment, but long enough for a Dominion scrying team to get a fix. The Commune is on high alert.' },
  { regionId: 'murkmire', text: 'A lizardfolk astronomer was seen at the Murkmire market, buying navigational instruments. Lizardfolk never buy things in public. Something has changed in whatever they\'re observing.' },
  { regionId: 'murkmire', text: 'Mushroom tea exports from Shadow Fen have tripled. Either the Commune is expanding cultivation or they\'re stockpiling currency for something they expect to need quickly.' },

  // mechspire
  { regionId: 'mechspire', text: 'Gnomish patrol ships turned back a Dominion trade delegation last month. No explanation given. The diplomats were furious but impotent — no one challenges the Collective\'s navy.' },
  { regionId: 'mechspire', text: 'Factory output on the eastern isles has increased 300% according to shipping manifests, but exports have decreased. Whatever the Collective is building, it\'s for internal use. Phase Three, the deserters say. Nobody will explain what Phase Three actually does.' },
  { regionId: 'mechspire', text: 'A gnomish deserter washed up on the Fortuna coast babbling about Phase Three and a failsafe. The Inquest took her into custody before anyone could get details. The Guild got there two hours after the Inquest.' },

  // clockwork_harbor_town
  { regionId: 'clockwork_harbor_town', text: 'The harbor clocktower has been running three seconds fast for a month. Gnomish-trained engineers can\'t find the problem. Some say the mechanism is counting down to something.' },
  { regionId: 'clockwork_harbor_town', text: 'Smugglers are running gnomish components through the harbor at night. The Collective officially embargoes military technology, but someone on the inside is selling, and someone on the outside needs it badly enough to pay whatever\'s being asked.' },
  { regionId: 'clockwork_harbor_town', text: 'A catfolk merchant claims she saw a gnomish submarine surface near the harbor mouth at dawn. The harbor master says she was hallucinating. She insists she wasn\'t, and she drew a sketch of it.' },

  // fortunes_rest
  { regionId: 'fortunes_rest', text: 'The Salt Court convened near Fortune\'s Rest last season. Whatever they decided, catfolk caravans have started stockpiling dried food and water purification supplies in quantities that suggest they\'re planning for extended travel through hostile territory.' },
  { regionId: 'fortunes_rest', text: 'A catfolk gambler won a pre-war elven artifact in a dice game. The artifact started glowing green when she touched it. The Inquest confiscated it before anyone could figure out what it did. She says it felt warm.' },
  { regionId: 'fortunes_rest', text: 'Desert scouts report that the Scorched Sands are expanding. The glass fields have grown by a mile. Something underground is generating heat that the geological surveys can\'t account for.' },

  // wilderness / general
  { regionId: 'wilderness', text: 'Rift hunters in the northern mountains found a temporal Rift that aged a forest by a thousand years in seconds. The trees turned to dust. The Guild sealed the zone. The dust glowed faintly green in the dark.' },
  { regionId: 'wilderness', text: 'Caravan drivers along the eastern trade route report hearing music at night — specifically, music in a scale that scholars identify as pre-war elven. No source has been found.' },
  { regionId: 'wilderness', text: 'A merchant lost in the Great Desert stumbled into a ruin filled with writing in no known language. He copied some symbols before fleeing. The lizardfolk scholars who saw the copies went very quiet for a very long time.' },
  { regionId: 'wilderness', text: 'Shepherds near the Frostbound Reach report their flocks facing the same direction for hours, as if listening to something humans cannot hear. The direction is always south-southeast. Toward the old capital.' },
  { regionId: 'wilderness', text: 'The rise in vampire sightings across Fortuna correlates precisely with proximity to known lich strongholds. The Adventure Guild\'s research division has a map showing this. The map has been classified.' },
  { regionId: 'wilderness', text: 'A lone traveler claims he encountered a figure on the road who spoke in perfect Common but whose shadow didn\'t match his body. The figure asked if the traveler knew the current year. When told, the figure was silent for a long moment, then walked into the tree line without turning around.' },

  // additional town rumors
  { regionId: 'starter_town', text: 'The Guild archivist has been requesting ancient maps of the old human capital district. She won\'t say why, but she\'s been working nights and eating at her desk.' },
  { regionId: 'solara', text: 'A reform Cardinal was found dead in her chambers. The Church says heart failure. Her supporters say she was about to publish evidence that the Cathedral\'s sub-basement contained something still alive that the Doctrine forbids acknowledging.' },
  { regionId: 'sylvaris', text: 'Elven craftsmen in Sylvaris have started producing weapons for the first time since the Magic Ban. The Administration claims it is for Rift defense. The Inquest is watching closely. The Ancient One who recommended the production has not explained her reasoning.' },
  { regionId: 'ironhold', text: 'A dwarven prospector returned from the Utterdeep with a metal no one can identify. It doesn\'t rust, can\'t be melted, and hums when you hold it to your ear. It also glows faintly green in the dark, which the prospector is trying very hard not to think about.' },
  { regionId: 'kragmor', text: 'A young orc claims to have found Morghul the Undying\'s burial sword on the Bone Fields. The clan chiefs are arguing about whether it\'s genuine or a plant. Nobody is arguing about what it would mean if it is genuine.' },
  { regionId: 'bonetrap', text: 'Goblin children in Bonetrap are playing a new game they call "Spark Tag." It involves actual explosive charges. The casualty rate is concerning even by goblin standards. The sparks say it\'s training, not play. They are not wrong.' },
  { regionId: 'murkmire', text: 'Fishermen near Murkmire pulled something out of the swamp that looks like a bone but is made of glass — green glass, warm to the touch, glowing until it was dropped back in the water. The Astronomy Sect sent three representatives to examine the location. They took extensive notes and departed without comment.' },
  { regionId: 'mechspire', text: 'A gnomish engineer was publicly stripped of rank for asking questions about Phase Three in a Council session. She was escorted to the docks and put on a ship to the Fortuna coast. She hasn\'t spoken since. She holds a piece of paper with seven words written on it. She won\'t show it to anyone.' },
  { regionId: 'fortunes_rest', text: 'A catfolk elder claims the Salt Court has secretly commissioned a permanent building — the first in catfolk history. Traditionalists are outraged. Pragmatists are relieved. The building\'s purpose, per the elder, is to hold records that the caravan network can no longer safely transport.' },
];


// ---------------------------------------------------------------------------
// RIFT CLASSIFICATIONS — types of dimensional tears
// ---------------------------------------------------------------------------

const RIFT_TYPES = [
  {
    id: 'standard',
    name: 'Standard Rift',
    threat: 'Variable (Class 1-10)',
    description: 'The most common type of dimensional tear found on Fortuna. Standard Rifts open into infinite shifting pocket dimensions populated by hostile entities and exotic materials. Each floor is new — new biome, new layout, new creatures — and the beings within them are near-perfect replicas of species known on the surface, but hollow in some fundamental way: light escapes their eyes differently, they cannot speak when spoken to, they sometimes twitch unnervingly or shift appearance mid-combat. The Adventure Guild classifies Standard Rifts on a 1-10 scale based on measured difficulty. What the scale does not capture is the effect on experienced adventurers: that the further you descend, the less the hollow replicas feel like copies of things you know, and the more they feel like things you almost recognize.'
  },
  {
    id: 'lich_sanctum',
    name: 'Lich Sanctum Rift',
    threat: 'Extreme (Class 8-10)',
    description: 'Secondary rifts that appear near established lich strongholds — tears in the fabric of Fortuna created by necromancers operating under the lich\'s direction. Unlike the primary Rift at the capital, lich sanctum rifts are deliberately formed: the necromancers identify weaknesses in the world\'s structure and exploit them to widen the existing tear and create new access points. The interior of a lich sanctum rift feels different from a standard rift — the replica beings within have a faint green luminescence to their hollow eyes, and the architecture of the floors resembles, in distorted ways, structures that scholars who know their history might recognize as Calidan marble and obsidian. The lich is looking for a way out. These rifts are his attempts to widen the door.'
  },
  {
    id: 'temporal',
    name: 'Temporal Rift',
    threat: 'Extreme',
    description: 'Rifts that distort the flow of time within their area of effect. Objects and creatures caught in a temporal rift may age centuries in seconds or regress to a younger state. Temporal Rifts cannot be safely entered and must be contained using specialized equipment. They are most common near the Frostbound Reach, though the reason for this geographic correlation is unknown to the Adventure Guild. The Astronomy Sect\'s records suggest an explanation but have not been shared.'
  },
  {
    id: 'gravity',
    name: 'Gravity Rift',
    threat: 'High',
    description: 'Rifts that create localized gravitational anomalies — areas of extreme weight, weightlessness, or directional gravity shifts. Gravity Rifts have been known to create floating islands, inverted lakes, and zones where falling is horizontal. They are disorienting and dangerous but can occasionally produce valuable anti-gravity materials used in gnomish engineering. The Collective takes careful note of every gravity rift location on Fortuna.'
  },
  {
    id: 'echo',
    name: 'Echo Rift',
    threat: 'Moderate to High',
    description: 'Rifts that replay historical events as hostile phantasms. Echo Rifts near the Wastes of Calidar recreate scenes from the elven and dark elven civilization\'s final hours — the marble halls, the obsidian towers, the last moments before the green light. The phantasms are not intelligent but are dangerous. They attack anything that doesn\'t belong in the replayed scene. Elven adventurers are advised to avoid echo rifts near the Wastes. Ancient Ones refuse to discuss them.'
  },
  {
    id: 'mana_storm',
    name: 'Mana Storm Rift',
    threat: 'Catastrophic',
    description: 'The rarest and most dangerous Rift type on Fortuna. Mana Storm Rifts do not open into pocket dimensions — instead, they release vast quantities of raw, unstructured mana into the environment, disrupting all magical activity within hundreds of miles. The last major Mana Storm Rift event disabled protective wards across the continent and caused widespread destruction. The Luminary Inquest considers Mana Storm Rifts a top-tier threat. The Astronomy Sect\'s private assessment is that a Mana Storm Rift near Solara would interact catastrophically with the sealed vaults below the Cathedral — a scenario they have modeled extensively and do not discuss in public correspondence.'
  },
];


// ---------------------------------------------------------------------------
// LEGENDS — Notable historical figures referenced in lore and NPC dialogue
// ---------------------------------------------------------------------------

const LEGENDS = [
  {
    id: 'the_soldier',
    name: 'The Unnamed Soldier (The Lich)',
    race: 'human',
    era: 'year_zero',
    yearsActive: 'Year 0 — Present (inside the Rift)',
    title: 'Bearer of Heaven\'s Atlas; the First and Only Lich of Fortuna',
    description: 'He had a name once. The Dominion\'s records were purged in Year 3, his identity classified above the Cardinal level. What is known — to the Veiled Hand, to the Astronomy Sect\'s sealed archives, and to no one else — is this: he was the Dominion\'s greatest warrior, righteous by every measure his culture possessed, personally chosen by the Prophet-King and given Heaven\'s Atlas in a great metal container, told his mission was divine justice. He swept through Calidar like a plague and placed the device at the city\'s heart and activated it. A god seized his consciousness above the destruction. A god implanted a malicious artifact in his chest — an artifact with a task: five divine souls within the rift, five souls to retrieve. He entered the rift. He fought for what felt like aeons on its ever-shifting floors, floor after floor of hollow replica beings and impossible architectures. He retrieved all five souls. The god took them, took the artifact, told him this was his eternal torment, and moved the rift to the old human capital as punishment for all its arrogance. He has been inside it ever since. For five hundred years, he has been searching for a way to reach Helios, to ask his god for help, to understand what he did and why it has cost him everything. He does not know that Helios is sealed below the capital. He does not know that Helios is barely alive. He does not know that the divine essence leaking out of him into the world — into the vampires, the werewolves, the eldritch things and leviathans that have multiplied across Fortuna — is the consequence not of malice but of five centuries of a good man in the wrong place, trying to find his god.'
  },
  {
    id: 'morghul',
    name: 'Great Khan Morghul the Undying',
    race: 'orc',
    era: 'helios_doctrine',
    yearsActive: '-350 to -45',
    title: 'Last Great Khan of the United Khanate',
    description: 'The longest-reigning Great Khan in orcish history, Morghul held the fractious clans together through three centuries of total war through sheer force of will, tactical genius, and an almost supernatural ability to survive injuries that should have been fatal — earning him the epithet "the Undying." His death in Year -45 at the hands of a Dominion crusade army, five years before the Atlas detonated, shattered the Khanate\'s unity. His last words, "The steppe remembers," are carved into every orcish clan totem. The Veiled Hand\'s sealed records suggest the Khan\'s unfinished succession clause was not an accident. The Veiled Hand\'s assessment was that a unified Khanate would force the Dominion to deploy another Atlas-level weapon. The assessment may have been correct. This does not make the decision less troubling.'
  },
  {
    id: 'korrath',
    name: 'Korrath Deepaxe',
    race: 'dwarf',
    era: 'guild_age',
    yearsActive: '460-493',
    title: 'First Relic-Rank Adventurer',
    description: 'A dwarven tunnel-fighter who joined the Adventure Guild in its first decade and rose through the ranks with unprecedented speed. His solo descent into a high-class Rift near the Calidar Wastes produced an artifact that stabilized Rift activity in the region for decades. He vanished during a subsequent expedition in Year 493. The Guild never officially declared him dead; his name remains on the active roster, listed as "status unknown." Dwarves who worked with him say he was asking, in his last months, about the green luminescence at depth and whether anyone had matched it to historical descriptions of Heaven\'s Atlas.'
  },
  {
    id: 'seraphine_voss',
    name: 'Inquisitor-Marshal Seraphine Voss',
    race: 'human',
    era: 'present',
    yearsActive: '461-present',
    title: 'Grand Luminary of the Inquest',
    description: 'The current head of the Luminary Inquest on Fortuna. Voss rose through the ranks during the Rift surge of Year 450, earning a reputation for ruthless efficiency and an unwavering belief in the necessity of the Magic Ban. She views the Adventure Guild\'s expanding authority with undisguised alarm and has been quietly building the Inquest\'s independent military capability. At 61, she is the youngest Grand Luminary in three centuries. What she knows about the vaults below Solara she has never put in writing.'
  },
  {
    id: 'ironmother',
    name: 'The Ironmother',
    race: 'goblin',
    era: 'middle_period',
    yearsActive: 'Approximately Years 200-250',
    title: 'Architect of the Modern Resistance',
    description: 'Known only by her title, the Ironmother transformed the goblin resistance from a loose collection of desperate tunnel-fighters into the sophisticated cell-based intelligence network that persists to the present day on Fortuna. She designed the compartmentalization protocols, dead drop systems, and rapid knowledge-transfer methods that define goblin operational culture. No portrait exists. No birth name was recorded. Her legacy is an organization that has outlived every empire on the continent.'
  },
  {
    id: 'ancient_one_thessaly',
    name: 'Thessaly of the Silver Spire',
    race: 'elf',
    era: 'present',
    yearsActive: '-2000 to present',
    title: 'Last Keeper of the Silver Spire Archive',
    description: 'One of the few surviving Ancient Ones — elves who predate the Last World War. Thessaly is approximately 2,500 years old and carries within her memory a firsthand account of Calidar at its height: the marble colonnades, the obsidian towers, the dark elves who were her neighbors and colleagues and fellow citizens. She also remembers the night the sky went green. She serves as an unofficial advisor to the Administration and is the only living being who can read pre-war High Elven and Dark Elven script fluently. She resides near Sylvaris, as close to the Wastes as safety permits. She has never described what Calidar looked like in past tense.'
  },
  {
    id: 'synthesis_prime',
    name: 'Synthesis Prime Orvek Gearwright',
    race: 'gnome',
    era: 'present',
    yearsActive: '360-present',
    title: 'Chair of the Synthesis Council',
    description: 'The senior member of the Gnomish Collective\'s governing body on Fortuna. Gearwright is 140 years old and has served on the Council for over seventy years. He is believed to be the architect of Phase Three, though he has never confirmed this publicly. Continental intelligence agencies have attempted to assess his intentions through intercepted communications, behavioral analysis, and at least two failed espionage operations. What the gnomish Survey Station network detected that prompted the Phase Three update, he has shared with no one outside the Council.'
  },
  {
    id: 'kalissa',
    name: 'Kalissa the Reformer',
    race: 'human',
    era: 'present',
    yearsActive: '447-present',
    title: 'Cardinal of the Reform Movement',
    description: 'The most prominent voice within the Holy Dominion\'s internal reform faction — the Cardinals and clergy who believe the Helios Doctrine has been applied in ways that exceed and pervert its theological foundations. Kalissa has never directly challenged the doctrine\'s core claims. She has, however, published three theological papers arguing that the treatment of elves, dark elves, and orcs cannot be reconciled with any charitable reading of Helios\'s actual teachings as recorded in the earliest Dominion texts. The Inquest has reviewed her papers. The papers remain in circulation. Kalissa remains in her position. Both facts are more significant than they appear.'
  },
];


// ---------------------------------------------------------------------------
// RACE GREETINGS — Flavor text for race-specific NPC greetings
// ---------------------------------------------------------------------------

const RACE_GREETINGS = {
  human: [
    'By Helios\'s light, welcome traveler.',
    'The Doctrine guides us all. What brings you to these parts?',
    'Blessings of the Prophet-King upon you.',
    'Another faithful soul in strange times. The Dominion endures.',
  ],
  elf: [
    'Memory endures where stone crumbles. Welcome.',
    'The Administration acknowledges your presence.',
    'Time is long. Speak your business.',
    'We remember. We always remember.',
  ],
  orc: [
    'The steppe remembers. Ride well.',
    'Speak plainly or not at all. What do you need?',
    'Strength to you, traveler. The wind is at your back.',
    'The clan-moot welcomes those who come in good faith.',
  ],
  dwarf: [
    'Stone holds. What can I forge for you?',
    'Welcome to the Hold. Mind the scaffolding.',
    'Good work builds good lives. What\'s your trade?',
    'The syndicate is in session, but I\'ve got a moment.',
  ],
  gnome: [
    'Efficiency rating: acceptable. State your purpose.',
    'The gears turn. What needs engineering?',
    'Interesting. Let me calibrate my assessment.',
    'Production quota is ahead of schedule. I can spare a minute.',
  ],
  goblin: [
    'Keep your voice down. What do you need?',
    'I wasn\'t here. You didn\'t see me. But what do you want?',
    'Quick, quick. Time is shorter than you think.',
    'The network provides. What are you looking for?',
  ],
  lizardfolk: [
    'The stars have predicted your arrival. Approximately.',
    'Observation suggests you have a question. Ask.',
    'We watch. We wait. We listen. Speak.',
    'The patterns are more interesting than usual today.',
  ],
  catfolk: [
    'Fortune favors the bold! What\'s your wager?',
    'The caravan rests here tonight. Pull up a cushion.',
    'Luck is a river. Are you swimming or drowning?',
    'The Salt Court extends its hospitality. Dice?',
  ],
};


// ---------------------------------------------------------------------------
// QUERY FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Returns lore data for a specific race, or null if the race ID is not found.
 * @param {string} raceId - One of: human, elf, orc, dwarf, gnome, goblin, lizardfolk, catfolk
 * @returns {object|null}
 */
function getRaceLore(raceId) {
  return RACE_LORE[raceId] || null;
}

/**
 * Returns lore data for a specific faction, or null if the faction ID is not found.
 * @param {string} factionId - One of: adventure_guild, holy_dominion, luminary_inquest, veiled_hand, free_holds, khanate, gnomish_collective, shadow_fen_commune
 * @returns {object|null}
 */
function getFactionLore(factionId) {
  return FACTION_LORE[factionId] || null;
}

/**
 * Returns a random fact string suitable for loading screens or NPC dialogue.
 * @returns {string}
 */
function getRandomFact() {
  return RANDOM_FACTS[Math.floor(Math.random() * RANDOM_FACTS.length)];
}

/**
 * Returns a random rumor for the given region, or null if no rumors exist for that region.
 * @param {string} regionId - A zone ID (e.g. 'starter_town', 'solara', 'wilderness')
 * @returns {object|null} Object with regionId and text properties, or null
 */
function getRegionalRumor(regionId) {
  const matching = REGIONAL_RUMORS.filter(function(r) { return r.regionId === regionId; });
  if (matching.length === 0) return null;
  return matching[Math.floor(Math.random() * matching.length)];
}

/**
 * Returns all rumors for a given region.
 * @param {string} regionId
 * @returns {Array}
 */
function getAllRegionalRumors(regionId) {
  return REGIONAL_RUMORS.filter(function(r) { return r.regionId === regionId; });
}

/**
 * Returns all timeline entries that fall within the given era.
 * @param {string} eraId - One of: pre_war, helios_doctrine, year_zero, early_age, middle_period, late_period, guild_age, present
 * @returns {Array} Array of timeline entry objects
 */
function getTimelineByEra(eraId) {
  var era = WORLD_HISTORY.eras.find(function(e) { return e.id === eraId; });
  if (!era) return [];
  return WORLD_HISTORY.timeline.filter(function(entry) {
    return entry.year >= era.yearRange[0] && entry.year <= era.yearRange[1];
  });
}

/**
 * Returns the era object for a given year.
 * @param {number} year
 * @returns {object|null}
 */
function getEraForYear(year) {
  for (var i = 0; i < WORLD_HISTORY.eras.length; i++) {
    var era = WORLD_HISTORY.eras[i];
    if (year >= era.yearRange[0] && year <= era.yearRange[1]) {
      return era;
    }
  }
  return null;
}

/**
 * Returns a geographic region by ID, or null if not found.
 * @param {string} regionId
 * @returns {object|null}
 */
function getGeography(regionId) {
  for (var i = 0; i < GEOGRAPHY.length; i++) {
    if (GEOGRAPHY[i].id === regionId) return GEOGRAPHY[i];
  }
  return null;
}

/**
 * Returns all race IDs.
 * @returns {string[]}
 */
function getAllRaceIds() {
  return Object.keys(RACE_LORE);
}

/**
 * Returns all faction IDs.
 * @returns {string[]}
 */
function getAllFactionIds() {
  return Object.keys(FACTION_LORE);
}

/**
 * Returns a legend/notable figure by ID, or null if not found.
 * @param {string} legendId
 * @returns {object|null}
 */
function getLegend(legendId) {
  for (var i = 0; i < LEGENDS.length; i++) {
    if (LEGENDS[i].id === legendId) return LEGENDS[i];
  }
  return null;
}

/**
 * Returns all legends for a given race.
 * @param {string} raceId
 * @returns {Array}
 */
function getLegendsByRace(raceId) {
  return LEGENDS.filter(function(l) { return l.race === raceId; });
}

/**
 * Returns a random race-appropriate NPC greeting.
 * @param {string} raceId
 * @returns {string}
 */
function getRaceGreeting(raceId) {
  var greetings = RACE_GREETINGS[raceId];
  if (!greetings || greetings.length === 0) return 'Greetings, traveler.';
  return greetings[Math.floor(Math.random() * greetings.length)];
}

module.exports = {
  WORLD_HISTORY,
  RACE_LORE,
  FACTION_LORE,
  GEOGRAPHY,
  RANDOM_FACTS,
  REGIONAL_RUMORS,
  RIFT_TYPES,
  LEGENDS,
  RACE_GREETINGS,
  getRaceLore,
  getFactionLore,
  getRandomFact,
  getRegionalRumor,
  getAllRegionalRumors,
  getTimelineByEra,
  getEraForYear,
  getGeography,
  getAllRaceIds,
  getAllFactionIds,
  getLegend,
  getLegendsByRace,
  getRaceGreeting,
};
