// The bunny designs the player can choose between (Settings > Bunny design).
// Both share the same skeleton, animation clips and material names; they only
// differ in shape, so the hard-coded fit values for things that sit on the body
// live here, per design. Positions are in the bunny's rest-pose space.
export const BUNNY_MODELS = {
  new: {
    label: 'New',
    url: import.meta.env.BASE_URL + 'bunny.glb',
    blush: [0.02, -0.04, 0.01], // offset from each eye to the cheek
    accessories: {
      bow: { bone: 'Head', pos: [0.07, 0.49, 0.13], rot: [0.1, 0, -0.45] },
      crown: { bone: 'Head', pos: [0, 0.46, 0.14], rot: [0.22, 0, 0] },
      hat: { bone: 'Head', pos: [-0.025, 0.55, 0.14], rot: [0.1, 0, 0.25] },
      scarf: { bone: 'Neck', pos: [0, 0.21, 0.06], rot: [0.28, 0, 0] }
    }
  },
  classic: {
    label: 'Classic',
    url: import.meta.env.BASE_URL + 'bunny-classic.glb',
    blush: [0.014, -0.045, -0.008],
    accessories: {
      bow: { bone: 'Head', pos: [0.07, 0.53, 0.15], rot: [0.1, 0, -0.45] },
      crown: { bone: 'Head', pos: [0, 0.515, 0.15], rot: [0.22, 0, 0] },
      hat: { bone: 'Head', pos: [-0.025, 0.6, 0.16], rot: [0.1, 0, 0.25] },
      scarf: { bone: 'Neck', pos: [0, 0.29, 0.06], rot: [0.28, 0, 0] }
    }
  }
}

export const DEFAULT_BUNNY_MODEL = 'new'

export function bunnyModel(key) {
  return BUNNY_MODELS[key] || BUNNY_MODELS[DEFAULT_BUNNY_MODEL]
}
