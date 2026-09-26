export type Member = {
  id: string
  name: string
  epithet: string
  village: string
  ring: string
  partner: string
  category: 'core' | 'legacy'
  story: string
  techniques: string[]
}

export const members: Member[] = [
  {
    id: 'itachi',
    name: 'Itachi Uchiha',
    epithet: 'The silent protector',
    village: 'Hidden Leaf',
    ring: 'Scarlet',
    partner: 'Kisame Hoshigaki',
    category: 'core',
    story:
      'A prodigy who chose to be remembered as a villain. Beneath the red clouds, Itachi carried the weight of his clan, his village, and a promise to protect his younger brother. His true allegiance was the secret he guarded most carefully.',
    techniques: ['Tsukuyomi', 'Amaterasu', 'Susanoo'],
  },
  {
    id: 'pain',
    name: 'Pain / Nagato',
    epithet: 'The architect of peace',
    village: 'Hidden Rain',
    ring: 'Zero',
    partner: 'Konan',
    category: 'core',
    story:
      'Once a student of Jiraiya, Nagato inherited a dream of peace in a country shaped by conflict. Through the Six Paths of Pain, he became the public leader of the Akatsuki, believing that shared suffering would end the cycle of war.',
    techniques: ['Rinnegan', 'Six Paths of Pain', 'Almighty Push'],
  },
  {
    id: 'konan',
    name: 'Konan',
    epithet: 'The paper angel',
    village: 'Hidden Rain',
    ring: 'White',
    partner: 'Pain / Nagato',
    category: 'core',
    story:
      "One of the original three founders, Konan never abandoned the hope that brought the Akatsuki into being. Her quiet resolve and extraordinary control of paper made her both Nagato's closest ally and the guardian of their shared dream.",
    techniques: [
      'Dance of the Shikigami',
      'Paper Clone',
      'Paper Person of God',
    ],
  },
  {
    id: 'kisame',
    name: 'Kisame Hoshigaki',
    epithet: 'The tailless tailed beast',
    village: 'Hidden Mist',
    ring: 'South',
    partner: 'Itachi Uchiha',
    category: 'core',
    story:
      'Disillusioned by a world of secrets, Kisame sought something that could be called true. His enormous chakra reserves and living sword, Samehada, made him formidable; his understated partnership with Itachi revealed an unexpected loyalty.',
    techniques: ['Samehada', 'Water Prison Shark Dance', 'Great Shark Bullet'],
  },
  {
    id: 'deidara',
    name: 'Deidara',
    epithet: 'The fleeting artist',
    village: 'Hidden Stone',
    ring: 'Blue',
    partner: 'Sasori, then Tobi',
    category: 'core',
    story:
      "To Deidara, beauty existed in a single, unrepeatable instant. A missing-nin with a sculptor's imagination, he shaped chakra-infused clay into intricate creations, forever arguing with Sasori over whether true art should vanish or endure.",
    techniques: ['Explosive Clay', 'Clay Clones', 'C4 Karura'],
  },
  {
    id: 'sasori',
    name: 'Sasori',
    epithet: 'The eternal artist',
    village: 'Hidden Sand',
    ring: 'Jewel',
    partner: 'Deidara',
    category: 'core',
    story:
      'A master puppeteer who pursued permanence in an impermanent world. Sasori transformed the puppet arts of the Hidden Sand, hiding a deeply human longing behind a collection of carefully engineered creations.',
    techniques: [
      'Hiruko',
      'Third Kazekage Puppet',
      'Performance of a Hundred Puppets',
    ],
  },
  {
    id: 'tobi',
    name: 'Tobi / Obito',
    epithet: 'The man behind the mask',
    village: 'Hidden Leaf',
    ring: 'Jewel, after Sasori',
    partner: 'Deidara, then Zetsu',
    category: 'core',
    story:
      'A playful mask concealed the architect working behind the Akatsuki. Once a young shinobi who dreamed of becoming Hokage, Obito lost faith in reality and pursued a world where loss itself could be rewritten.',
    techniques: ['Kamui', 'Sharingan', 'Wood Release'],
  },
  {
    id: 'hidan',
    name: 'Hidan',
    epithet: 'The immortal believer',
    village: 'Hidden Hot Water',
    ring: 'Three',
    partner: 'Kakuzu',
    category: 'core',
    story:
      "An outspoken devotee of Jashin, Hidan possessed an extraordinary form of immortality. His impulsiveness stood in constant opposition to Kakuzu's cold pragmatism, making their partnership as volatile as it was enduring.",
    techniques: ['Immortality', 'Jashin Ritual', 'Triple-Bladed Scythe'],
  },
  {
    id: 'kakuzu',
    name: 'Kakuzu',
    epithet: 'The keeper of hearts',
    village: 'Hidden Waterfall',
    ring: 'North',
    partner: 'Hidan',
    category: 'core',
    story:
      'A veteran from another era, Kakuzu measured the world in contracts and bounties. His forbidden Earth Grudge Fear technique extended his life and granted access to multiple chakra natures, while his financial discipline funded the organization.',
    techniques: ['Earth Grudge Fear', 'Five Chakra Natures', 'Iron Skin'],
  },
  {
    id: 'zetsu',
    name: 'Zetsu',
    epithet: 'The unseen observer',
    village: 'Unknown',
    ring: 'Boar',
    partner: 'Tobi / Obito',
    category: 'core',
    story:
      "Two contrasting halves shared the Akatsuki's most elusive presence. White Zetsu moved through the land as a living intelligence network; Black Zetsu quietly pursued a much older agenda that reached beyond the organization itself.",
    techniques: ['Mayfly', 'Spore Technique', 'Chakra Sensing'],
  },
  {
    id: 'yahiko',
    name: 'Yahiko',
    epithet: 'The first dawn',
    village: 'Hidden Rain',
    ring: 'Before the ring system',
    partner: 'Nagato & Konan',
    category: 'legacy',
    story:
      'Before the red clouds became a symbol of fear, Yahiko founded the Akatsuki with Nagato and Konan to bring peace to the Hidden Rain. His optimism gave the movement its first purpose; his loss changed its course forever.',
    techniques: ['Water Release', 'Kenjutsu', 'Founding Leadership'],
  },
  {
    id: 'orochimaru',
    name: 'Orochimaru',
    epithet: 'The restless seeker',
    village: 'Hidden Leaf',
    ring: 'Sky',
    partner: 'Sasori',
    category: 'legacy',
    story:
      'One of the Legendary Sannin, Orochimaru joined the Akatsuki in pursuit of knowledge and powerful techniques. His fascination with the Sharingan brought him into conflict with Itachi and ultimately ended his time beneath the red clouds.',
    techniques: ['Reincarnation', 'Summoning', 'Eight Branches Technique'],
  },
]
