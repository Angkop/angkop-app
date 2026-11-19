import * as THREE from 'three'

// Frees every geometry, material and texture in a scene, which three.js never does by itself.
export const disposeOf = (scene: THREE.Scene) =>
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    for (const material of [object.material].flat()) {
      if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
      material.dispose()
    }
  })
