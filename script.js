// Three.js setup and shader code
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  #define PI 3.14159265359
  
  // Noise functions
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 6; i++) {
      value += amplitude * noise(st * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    // Center and scale coordinates
    vec2 center = vUv * 2.0 - 1.0;
    float radius = length(center);
    float angle = atan(center.y, center.x);
    
    // Rotation
    float rotationSpeed = time * 0.2;
    float rotatedAngle = angle + rotationSpeed;
    vec2 rotatedUv = vec2(
      cos(rotatedAngle) * radius,
      sin(rotatedAngle) * radius
    );
    
    // Create base nebula shape
    float ring = smoothstep(0.3, 0.7, radius) * (1.0 - smoothstep(0.7, 0.9, radius));
    
    // Add detailed noise layers
    float noise1 = fbm(rotatedUv * 3.0 + time * 0.1);
    float noise2 = fbm(rotatedUv * 5.0 - time * 0.15);
    float noise3 = fbm(rotatedUv * 8.0 + time * 0.2);
    
    // Combine noise layers with different frequencies
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    
    // Create particle effect
    float particles = 0.0;
    for(float i = 0.0; i < 3.0; i++) {
      vec2 particleUv = rotatedUv * (2.0 + i) + time * (0.1 + i * 0.05);
      float particle = step(0.98, noise(particleUv * 10.0));
      particles += particle * (1.0 - i * 0.2);
    }
    
    // Final color composition
    float final = ring * combinedNoise + particles;
    final *= (1.0 - radius * 0.5); // Fade towards edges
    
    // Add brightness variations
    final = pow(final, 0.8); // Adjust contrast
    
    gl_FragColor = vec4(vec3(final), 1.0);
  }
`;

let scene, camera, renderer, plane;
let mouseX = 0;
let mouseY = 0;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('globe-container').appendChild(renderer.domElement);

  // Create plane with shader material
  const geometry = new THREE.PlaneGeometry(2, 2, 128, 128);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: 0 }
    }
  });

  plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  camera.position.z = 1;

  // Event listeners
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onWindowResize);
}

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  
  // Update uniforms
  plane.material.uniforms.time.value += 0.01;
  
  // Subtle camera movement based on mouse
  camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.02;
  camera.position.y += (mouseY * 0.05 - camera.position.y) * 0.02;
  camera.lookAt(scene.position);
  
  renderer.render(scene, camera);
}

// Initialize animation
init();
animate();

// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuItems = document.querySelectorAll('.menu-item');

    if (hamburgerBtn && menuOverlay) {
        function toggleMenu() {
            hamburgerBtn.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            
            menuItems.forEach((item, index) => {
                if (menuOverlay.classList.contains('active')) {
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, index * 100);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                }
            });
        }

        hamburgerBtn.addEventListener('click', toggleMenu);
        
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                toggleMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
                toggleMenu();
            }
        });
    }
});

// Scroll animation logic
const sections = document.querySelectorAll('.section');
let currentSection = 0;

function checkScroll() {
    sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const trigger = window.innerHeight * 0.5;
        
        if (rect.top <= trigger && rect.bottom >= trigger) {
            section.classList.add('active');
            currentSection = index;
        } else {
            section.classList.remove('active');
        }
    });
}

// Initialize first section
sections[0].classList.add('active');

// Add scroll event listener
window.addEventListener('scroll', checkScroll);
window.addEventListener('resize', checkScroll);

// Apply random positions to nav items
sections.forEach(section => {
    const navItem = section.querySelector('.nav-item');
    const randomX = (Math.random() - 0.5) * 40; // Random X position ±20% of viewport
    const randomY = (Math.random() - 0.5) * 40; // Random Y position ±20% of viewport
    navItem.style.transform = `translate(${randomX}%, ${randomY}%) rotate(${navItem.dataset.rotation}deg)`;
});

// Add click handlers to make items interactive
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        // Add your navigation logic here
        console.log('Clicked:', item.textContent);
    });
});
