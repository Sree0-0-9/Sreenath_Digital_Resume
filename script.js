const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Navigation, global progress and cursor atmosphere.
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const progressBar = document.querySelector('.scroll-progress span');
const cursorGlow = document.querySelector('.cursor-glow');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
});

document.querySelectorAll('.nav-links a').forEach((link) => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}));

const updatePageProgress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  const ratio = max > 0 ? scrollY / max : 0;
  progressBar.style.width = `${ratio * 100}%`;
  header.classList.toggle('scrolled', scrollY > 30);

  const journey = document.querySelector('.signal-path');
  const journeyProgress = document.querySelector('#pathProgress');
  if (journey && journeyProgress) {
    const rect = journey.getBoundingClientRect();
    const travelled = clamp((innerHeight * .66 - rect.top) / (rect.height + innerHeight * .18), 0, 1);
    journeyProgress.style.height = `${travelled * 100}%`;
  }
};
window.addEventListener('scroll', updatePageProgress, { passive: true });
updatePageProgress();

window.addEventListener('pointermove', (event) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
}, { passive: true });

// Ambient analytical constellation.
const ambientCanvas = document.querySelector('#ambientCanvas');
const ambientCtx = ambientCanvas.getContext('2d');
let ambientParticles = [];
let ambientPointer = { x: innerWidth * .5, y: innerHeight * .5 };

function resizeAmbient() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  ambientCanvas.width = innerWidth * dpr;
  ambientCanvas.height = innerHeight * dpr;
  ambientCanvas.style.width = `${innerWidth}px`;
  ambientCanvas.style.height = `${innerHeight}px`;
  ambientCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = clamp(Math.floor((innerWidth * innerHeight) / 15000), 45, 105);
  ambientParticles = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - .5) * .14,
    vy: (Math.random() - .5) * .14,
    r: Math.random() * 1.3 + .4,
    tone: index % 11 === 0 ? 'coral' : index % 7 === 0 ? 'violet' : index % 5 === 0 ? 'brass' : index % 3 === 0 ? 'cyan' : 'teal'
  }));
}

window.addEventListener('pointermove', (event) => {
  ambientPointer = { x: event.clientX, y: event.clientY };
}, { passive: true });

function drawAmbient() {
  ambientCtx.clearRect(0, 0, innerWidth, innerHeight);
  ambientParticles.forEach((particle, index) => {
    if (!reducedMotion) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < -20) particle.x = innerWidth + 20;
      if (particle.x > innerWidth + 20) particle.x = -20;
      if (particle.y < -20) particle.y = innerHeight + 20;
      if (particle.y > innerHeight + 20) particle.y = -20;
    }

    const dx = particle.x - ambientPointer.x;
    const dy = particle.y - ambientPointer.y;
    const pointerDistance = Math.hypot(dx, dy);
    if (pointerDistance < 170) {
      ambientCtx.strokeStyle = `rgba(98,230,197,${(1 - pointerDistance / 170) * .09})`;
      ambientCtx.beginPath();
      ambientCtx.moveTo(particle.x, particle.y);
      ambientCtx.lineTo(ambientPointer.x, ambientPointer.y);
      ambientCtx.stroke();
    }

    for (let j = index + 1; j < ambientParticles.length; j += 1) {
      const other = ambientParticles[j];
      const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
      if (distance < 110) {
        ambientCtx.strokeStyle = `rgba(111,170,180,${(1 - distance / 110) * .045})`;
        ambientCtx.beginPath();
        ambientCtx.moveTo(particle.x, particle.y);
        ambientCtx.lineTo(other.x, other.y);
        ambientCtx.stroke();
      }
    }

    const colors = { teal: 'rgba(98,230,197,.42)', cyan: 'rgba(85,191,245,.48)', brass: 'rgba(227,173,98,.5)', coral: 'rgba(255,130,111,.48)', violet: 'rgba(155,141,240,.5)' };
    ambientCtx.fillStyle = colors[particle.tone];
    ambientCtx.beginPath();
    ambientCtx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ambientCtx.fill();
  });
  requestAnimationFrame(drawAmbient);
}
resizeAmbient();
drawAmbient();

// Scroll reveals, counters and active navigation.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .1 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || '';
    const start = performance.now();
    const animate = (now) => {
      const progress = clamp((now - start) / 1200, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    counterObserver.unobserve(element);
  });
}, { threshold: .65 });
document.querySelectorAll('[data-count]').forEach((element) => counterObserver.observe(element));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.nav-links a[href^="#"]').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });
document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

// Rotating professional identity.
const roles = ['a Finance Analyst', 'a Data Analyst', 'a Business Analyst', 'a Business Intelligence Analyst'];
const roleText = document.querySelector('#roleText');
let roleIndex = 0;
if (!reducedMotion) {
  setInterval(() => {
    roleText.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-7px)' }], { duration: 220, fill: 'forwards' }).finished.then(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      roleText.textContent = roles[roleIndex];
      roleText.animate([{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 270, fill: 'forwards' });
    });
  }, 2500);
}

// Hero depth and card parallax.
const heroStage = document.querySelector('#heroStage');
const heroImage = heroStage.querySelector('.tilt-surface');
const floatingCards = [...heroStage.querySelectorAll('[data-depth]')];
heroStage.addEventListener('pointermove', (event) => {
  if (innerWidth < 820 || reducedMotion) return;
  const rect = heroStage.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width - .5;
  const py = (event.clientY - rect.top) / rect.height - .5;
  heroImage.style.transform = `rotateY(${px * 5}deg) rotateX(${-py * 5}deg) translateZ(0)`;
  floatingCards.forEach((card) => {
    const depth = Number(card.dataset.depth);
    card.style.transform = `translate(${px * depth * 14}px, ${py * depth * 14}px)`;
  });
});
heroStage.addEventListener('pointerleave', () => {
  heroImage.style.transform = '';
  floatingCards.forEach((card) => { card.style.transform = ''; });
});

// Finance, Data and Business decision system.
const lensCopy = {
  finance: { index: '01', label: 'FINANCE LENS', description: 'Budgeting, forecasting, financial modelling, profitability, cost attribution, variance analysis and decision support.' },
  data: { index: '02', label: 'DATA LENS', description: 'SQL, Python, Power BI, data modelling, validation, reconciliation, automation and analytical storytelling.' },
  business: { index: '03', label: 'BUSINESS LENS', description: 'Stakeholder discovery, requirements, process design, business rules, UAT, systems improvement and change adoption.' }
};
document.querySelectorAll('.lens-node').forEach((button) => button.addEventListener('click', () => {
  const lens = lensCopy[button.dataset.lens];
  document.querySelectorAll('.lens-node').forEach((node) => node.classList.remove('active'));
  button.classList.add('active');
  document.querySelector('#lensIndex').textContent = lens.index;
  document.querySelector('#lensLabel').textContent = lens.label;
  document.querySelector('#lensDescription').textContent = lens.description;
}));

// Expandable career journey.
document.querySelectorAll('.journey-summary').forEach((button) => button.addEventListener('click', () => {
  const card = button.closest('.journey-card');
  const open = card.classList.toggle('open');
  button.setAttribute('aria-expanded', String(open));
}));

// Reusable 3D skill sphere rendered on canvas.
const skillCanvas = document.querySelector('#skillsCanvas');
const skillCtx = skillCanvas.getContext('2d');
const skillTooltip = document.querySelector('#skillTooltip');
const skillCatalog = [
  ['Financial Modelling','finance'],['Budgeting','finance'],['Forecasting','finance'],['Variance Analysis','finance'],['Profitability','finance'],['Business Cases','finance'],['Scenario Analysis','finance'],['IFRS 9 ECL','finance'],
  ['Power BI','data'],['SQL','data'],['Python','data'],['DAX','data'],['Power Query','data'],['Azure SQL','data'],['Data Modelling','data'],['Data Governance','data'],
  ['Requirements','business'],['Process Mapping','business'],['UAT','business'],['Jira','business'],['Stakeholders','business'],['Business Rules','business'],['Change Delivery','business'],['SOPs','business']
];
const skillPalette = { finance: '#e3ad62', data: '#55bff5', business: '#9b8df0' };
let skillNodes = skillCatalog.map((item, index) => {
  const y = 1 - (index / (skillCatalog.length - 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const theta = Math.PI * (3 - Math.sqrt(5)) * index;
  return { name: item[0], category: item[1], x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius, sx: 0, sy: 0, visible: true };
});
let skillRotation = { x: -.15, y: .4 };
let skillVelocity = { x: .0008, y: .0016 };
let skillZoom = 1;
let skillDragging = false;
let skillLast = { x: 0, y: 0 };
let skillPointer = { x: -999, y: -999 };
let skillFilter = 'all';

function resizeCanvas(canvas, context) {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, rect.width * dpr);
  canvas.height = Math.max(1, rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return rect;
}

function rotatePoint(node, rx, ry) {
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const x1 = node.x * cosY - node.z * sinY;
  const z1 = node.x * sinY + node.z * cosY;
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  return { x: x1, y: node.y * cosX - z1 * sinX, z: node.y * sinX + z1 * cosX };
}

function drawSkills() {
  const rect = skillCanvas.parentElement.getBoundingClientRect();
  const width = rect.width, height = rect.height;
  skillCtx.clearRect(0, 0, width, height);
  if (!skillDragging && !reducedMotion) {
    skillRotation.x += skillVelocity.x;
    skillRotation.y += skillVelocity.y;
  }
  const radius = Math.min(width, height) * .33 * skillZoom;
  const cx = width / 2, cy = height / 2;
  const projected = skillNodes.map((node) => {
    const point = rotatePoint(node, skillRotation.x, skillRotation.y);
    const scale = (point.z + 2.25) / 3.25;
    node.sx = cx + point.x * radius;
    node.sy = cy + point.y * radius;
    node.depth = point.z;
    node.visible = skillFilter === 'all' || node.category === skillFilter;
    return { node, point, scale };
  }).sort((a,b) => a.point.z - b.point.z);

  // Orbital latitude lines give the sphere depth without a library.
  skillCtx.save();
  skillCtx.translate(cx, cy);
  for (let i = 1; i <= 4; i += 1) {
    const orbitColors = ['85,191,245', '155,141,240', '255,130,111', '227,173,98'];
    skillCtx.strokeStyle = `rgba(${orbitColors[i - 1]},${.035 + i * .008})`;
    skillCtx.lineWidth = 1;
    skillCtx.beginPath();
    skillCtx.ellipse(0, 0, radius, radius * (i * .12), skillRotation.y + i * .45, 0, Math.PI * 2);
    skillCtx.stroke();
  }
  skillCtx.restore();

  let hovered = null;
  projected.forEach(({ node, point, scale }) => {
    if (!node.visible) return;
    const alpha = clamp((point.z + 1.35) / 2.35, .18, 1);
    const distance = Math.hypot(skillPointer.x - node.sx, skillPointer.y - node.sy);
    const isHovered = distance < 26;
    if (isHovered) hovered = node;
    skillCtx.globalAlpha = alpha;
    skillCtx.fillStyle = skillPalette[node.category];
    skillCtx.shadowColor = skillPalette[node.category];
    skillCtx.shadowBlur = isHovered ? 24 : 10;
    skillCtx.beginPath();
    skillCtx.arc(node.sx, node.sy, (isHovered ? 5 : 3) * scale + 1, 0, Math.PI * 2);
    skillCtx.fill();
    skillCtx.shadowBlur = 0;
    skillCtx.font = `${isHovered ? 700 : 600} ${clamp(9 * scale + 3, 8, 14)}px Manrope`;
    skillCtx.textAlign = node.sx < cx ? 'right' : 'left';
    skillCtx.textBaseline = 'middle';
    skillCtx.fillStyle = isHovered ? '#ffffff' : 'rgba(221,237,236,.88)';
    skillCtx.fillText(node.name, node.sx + (node.sx < cx ? -10 : 10), node.sy);
  });
  skillCtx.globalAlpha = 1;
  if (hovered) {
    skillTooltip.querySelector('small').textContent = `${hovered.category.toUpperCase()} CAPABILITY`;
    skillTooltip.querySelector('strong').textContent = hovered.name;
    skillTooltip.querySelector('span').textContent = 'Selected from Sreenath’s analytical toolkit';
  }
  requestAnimationFrame(drawSkills);
}

skillCanvas.addEventListener('pointerdown', (event) => {
  skillDragging = true;
  skillLast = { x: event.clientX, y: event.clientY };
  skillCanvas.setPointerCapture(event.pointerId);
});
skillCanvas.addEventListener('pointermove', (event) => {
  const rect = skillCanvas.getBoundingClientRect();
  skillPointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  if (!skillDragging) return;
  const dx = event.clientX - skillLast.x;
  const dy = event.clientY - skillLast.y;
  skillRotation.y += dx * .008;
  skillRotation.x += dy * .008;
  skillVelocity = { x: dy * .00006, y: dx * .00006 };
  skillLast = { x: event.clientX, y: event.clientY };
});
skillCanvas.addEventListener('pointerup', () => { skillDragging = false; });
skillCanvas.addEventListener('pointercancel', () => { skillDragging = false; });
skillCanvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  skillZoom = clamp(skillZoom - event.deltaY * .0007, .72, 1.28);
}, { passive: false });
document.querySelectorAll('.skill-filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.skill-filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  skillFilter = button.dataset.skillFilter;
}));
const skillsCore = document.querySelector('#skillsCore');
skillsCore.addEventListener('click', () => {
  document.querySelectorAll('.skill-filter').forEach((item) => {
    item.classList.toggle('active', item.dataset.skillFilter === 'all');
  });
  skillFilter = 'all';
  skillZoom = 1;
  skillVelocity = { x: .0032, y: .006 };
  skillsCore.classList.remove('activated');
  void skillsCore.offsetWidth;
  skillsCore.classList.add('activated');
  skillTooltip.querySelector('small').textContent = 'INTEGRATED CAPABILITY';
  skillTooltip.querySelector('strong').textContent = 'Decision Intelligence';
  skillTooltip.querySelector('span').textContent = 'Finance, data and business evidence connected to practical decisions';
  setTimeout(() => skillsCore.classList.remove('activated'), 750);
});
resizeCanvas(skillCanvas, skillCtx);
drawSkills();

// Projects, cards and magnetic controls.
document.querySelectorAll('.project-filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.project-filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  const value = button.dataset.projectFilter;
  document.querySelectorAll('.project-card').forEach((card) => {
    const categories = card.dataset.projectCategory.split(' ');
    card.classList.toggle('hidden', value !== 'all' && !categories.includes(value));
  });
}));

document.querySelectorAll('.tilt-card').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (innerWidth < 820 || reducedMotion) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    card.style.transform = `rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-3px)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

document.querySelectorAll('.magnetic').forEach((element) => {
  element.addEventListener('pointermove', (event) => {
    if (innerWidth < 820 || reducedMotion) return;
    const rect = element.getBoundingClientRect();
    element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .08}px, ${(event.clientY - rect.top - rect.height / 2) * .1}px)`;
  });
  element.addEventListener('pointerleave', () => { element.style.transform = ''; });
});

// Contact sphere with pointer responsive orbit.
const contactCanvas = document.querySelector('#contactCanvas');
const contactCtx = contactCanvas.getContext('2d');
let contactPointer = { x: .5, y: .5 };
let contactPhase = 0;
function drawContactSphere() {
  const rect = contactCanvas.parentElement.getBoundingClientRect();
  const width = rect.width, height = rect.height;
  contactCtx.clearRect(0, 0, width, height);
  contactPhase += reducedMotion ? 0 : .003;
  const cx = width / 2 + (contactPointer.x - .5) * 22;
  const cy = height / 2 + (contactPointer.y - .5) * 22;
  const radius = Math.min(width, height) * .27;

  const glow = contactCtx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.7);
  glow.addColorStop(0, 'rgba(98,230,197,.13)');
  glow.addColorStop(.35, 'rgba(85,191,245,.06)');
  glow.addColorStop(1, 'rgba(3,11,18,0)');
  contactCtx.fillStyle = glow;
  contactCtx.fillRect(0, 0, width, height);

  for (let i = 0; i < 8; i += 1) {
    contactCtx.save();
    contactCtx.translate(cx, cy);
    contactCtx.rotate(contactPhase * (i % 2 ? 1 : -1) + i * .31);
    contactCtx.strokeStyle = `rgba(${i % 3 === 0 ? '227,173,98' : i % 2 ? '85,191,245' : '98,230,197'},${.07 + i * .008})`;
    contactCtx.lineWidth = 1;
    contactCtx.beginPath();
    contactCtx.ellipse(0, 0, radius * (1 + i * .055), radius * (.18 + i * .07), 0, 0, Math.PI * 2);
    contactCtx.stroke();
    contactCtx.restore();
  }

  for (let i = 0; i < 34; i += 1) {
    const angle = contactPhase * (i % 2 ? 1 : -1) * 1.8 + i * 2.399;
    const ring = radius * (.46 + (i % 7) * .09);
    const flatten = .42 + (i % 4) * .08;
    const x = cx + Math.cos(angle) * ring;
    const y = cy + Math.sin(angle) * ring * flatten;
    contactCtx.fillStyle = i % 7 === 0 ? 'rgba(227,173,98,.85)' : i % 3 === 0 ? 'rgba(85,191,245,.75)' : 'rgba(98,230,197,.65)';
    contactCtx.shadowColor = contactCtx.fillStyle;
    contactCtx.shadowBlur = 8;
    contactCtx.beginPath();
    contactCtx.arc(x, y, i % 6 === 0 ? 2.3 : 1.2, 0, Math.PI * 2);
    contactCtx.fill();
    contactCtx.shadowBlur = 0;
  }
  requestAnimationFrame(drawContactSphere);
}
contactCanvas.parentElement.addEventListener('pointermove', (event) => {
  const rect = contactCanvas.parentElement.getBoundingClientRect();
  contactPointer = { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
});
resizeCanvas(contactCanvas, contactCtx);
drawContactSphere();

// Contact composer: FormSubmit's AJAX endpoint delivers without navigating away.
const contactForm = document.querySelector('#contactForm');
const formStatus = document.querySelector('#formStatus');
const submitButton = contactForm.querySelector('button[type="submit"]');
const submitLabel = submitButton.querySelector('span');
contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fields = [...contactForm.querySelectorAll('input, textarea')];
  fields.forEach((field) => field.classList.remove('invalid'));
  formStatus.classList.remove('success');
  const invalid = fields.filter((field) => field.type !== 'hidden' && !field.checkValidity());
  if (invalid.length) {
    invalid.forEach((field) => field.classList.add('invalid'));
    formStatus.textContent = 'Please complete your name, a valid email and your message.';
    invalid[0].focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.add('sending');
  submitLabel.textContent = 'Sending message';
  formStatus.textContent = 'Sending securely...';

  try {
    const payload = Object.fromEntries(new FormData(contactForm).entries());
    const response = await fetch('https://formsubmit.co/ajax/sreenathsuman1@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false || result.success === 'false') {
      throw new Error('Message delivery failed');
    }
    contactForm.reset();
    formStatus.classList.add('success');
    formStatus.textContent = 'Message sent successfully. Thank you. I will respond as soon as possible.';
  } catch {
    formStatus.textContent = 'The message could not be sent. Please email sreenathsuman1@gmail.com directly.';
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove('sending');
    submitLabel.textContent = 'Send message';
  }
});

const copyButton = document.querySelector('.copy-email');
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyButton.dataset.email);
    const original = copyButton.textContent;
    copyButton.textContent = 'Email copied';
    setTimeout(() => { copyButton.textContent = original; }, 1700);
  } catch {
    copyButton.textContent = 'sreenathsuman1@gmail.com';
  }
});

window.addEventListener('resize', () => {
  resizeAmbient();
  resizeCanvas(skillCanvas, skillCtx);
  resizeCanvas(contactCanvas, contactCtx);
});

document.querySelector('#year').textContent = `© ${new Date().getFullYear()}`;
