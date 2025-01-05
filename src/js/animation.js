import TWEEN from '@tweenjs/tween.js';

export function moveCamera(camera, controls, startPosition, endPosition, startTarget, endTarget, duration = 2000) {
    // Create quaternions for smooth rotation
    const startRotation = camera.quaternion.clone();
    const endRotation = new THREE.Quaternion();
    const lookAt = new THREE.Matrix4();
    lookAt.lookAt(endPosition, endTarget, new THREE.Vector3(0, 1, 0));
    endRotation.setFromRotationMatrix(lookAt);

    // Disable controls during movement
    controls.enabled = false;

    // Create position tween
    new TWEEN.Tween(camera.position)
        .to(endPosition, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Create rotation tween
    new TWEEN.Tween(startRotation)
        .to(endRotation, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            camera.quaternion.copy(startRotation);
        })
        .start();

    // Create target tween
    new TWEEN.Tween(controls.target)
        .to(endTarget, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(() => {
            controls.enabled = true;
        })
        .start();
}

export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
} 