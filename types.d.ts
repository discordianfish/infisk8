declare module 'three-gpu-particle-system' {
  class ParticleSystem {
    constructor(scene, camera, opt_clock?, opt_randomFunction?);
    draw();
    createParticleEmitter(): ParticleEmitter
  }
  class ParticleEmitter {
    setColorRamp(colorRamp);
    setParameters(parameters, opt_perParticleParamSetter?);
    setTranslation(x, y, z);
    setState(stateId);
  }
}

