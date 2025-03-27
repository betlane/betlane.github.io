// wheel.js

// Canvas & context
var canvas = document.getElementById('wheelCanvas');
var wheelcontainer = document.getElementsByClassName('wheel-container');
var ctx = canvas.getContext('2d');

// Track total winnings
var totalWinnings = 0;

// Limit of 3 spins total
var spinsLeft = 3;

// Slice values, strictly alternating red/gold
// Negative => red, Non-negative => gold
var names = [
  "-50", "100",
  "-100","200",
  "-200","250",
  "-300","1000",
  "-500","Zero"
];

// Rigging: first 3 spins = 100, -50, 250
var riggedWinners = ["100", "-50", "250"];
var spinCount = 0;

// Wheel parameters
var startAngle = 0;
var arc = 0;
var spinTimeout = null;
var spinTime = 0;
// Extended total spin time to 7s for more dramatic slowdown
var spinTimeTotal = 10000; 
var totalRotation = 0;
var initialStartAngle = 0;

// Debounce flag
var isSpinning = false;

setCanvasSize();
drawWheel();
window.addEventListener('resize', function() {
  setCanvasSize();
  drawWheel();
});

// Spin on canvas click
canvas.addEventListener('click', spin);

/* ----------------------------------------------------------------
   spin(): Called when user clicks the canvas
   ----------------------------------------------------------------*/
function spin() {
  // If currently spinning, ignore further clicks
  if (isSpinning) {
    return;
  }

  // If no spins left, show a modal
  if (spinsLeft <= 0) {
    showModal("NO MORE SPINS!", "❌", "You have no more spins left!", null);
    return;
  }

  // Mark as spinning
  isSpinning = true;

  // Light rays
  canvas.classList.add('wheel-spinning');
  document.getElementById('lightRays').style.display = 'block'; // ✅ show effect

  // Decrement spins
  spinsLeft--;
  var spinsLeftLabel = document.getElementById('spinsLeftLabel');
  if (spinsLeftLabel) {
    spinsLeftLabel.textContent = "Spins Left: " + spinsLeft;
  }

  // Add spinning glow effect
  canvas.classList.add('wheel-spinning');

  // Prepare spin
  spinTime = 0;
  initialStartAngle = startAngle;

  // Possibly rig
  var riggedWinner = null;
  if (spinCount < riggedWinners.length) {
    riggedWinner = riggedWinners[spinCount];
    spinCount++;
  }

  // Decide how many rotations
  var rotations = Math.floor(Math.random() * 3) + 4; // random 3–5

  if (riggedWinner) {
    // If rigged
    var winnerIndex = names.indexOf(riggedWinner);
    if (winnerIndex === -1) {
      // fallback
      totalRotation = rotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
    } else {
      arc = (2 * Math.PI) / names.length;
      var desiredAngle = (names.length - winnerIndex) * arc - (arc / 2);
      desiredAngle = desiredAngle % (2 * Math.PI);

      var currentAngle = (startAngle + Math.PI / 2) % (2 * Math.PI);
      var angleDiff = (desiredAngle - currentAngle + 2 * Math.PI) % (2 * Math.PI);

      totalRotation = rotations * 2 * Math.PI + angleDiff;
    }
  } else {
    // Normal random spin
    totalRotation = rotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
  }

  // Start animation
  rotateWheel();
}

/* ----------------------------------------------------------------
   rotateWheel(): animates until spinTime >= spinTimeTotal
   ----------------------------------------------------------------*/
function rotateWheel() {
  // increment the elapsed spin time
  spinTime += 30;

  // if done, finalize spin
  if (spinTime >= spinTimeTotal) {
    startAngle = initialStartAngle + totalRotation;
    startAngle %= (2 * Math.PI);
    stopRotateWheel();
    return;
  }
  // progress from 0..1
  var t = spinTime / spinTimeTotal;
  // use a more dramatic "ease out expo" for slow end
  var easedT = easeOutExpo(t);

  // compute current angle
  startAngle = initialStartAngle + easedT * totalRotation;
  drawWheel();

  spinTimeout = setTimeout(rotateWheel, 30);
}

/* ----------------------------------------------------------------
   stopRotateWheel(): Called when spin completes
   ----------------------------------------------------------------*/
function stopRotateWheel() {
  clearTimeout(spinTimeout);
  isSpinning = false;

  // Remove spinning glow effect
  canvas.classList.remove('wheel-spinning');

  // Determine final slice
  var degrees = (startAngle * 180 / Math.PI) + 90;
  var arcd = arc * 180 / Math.PI;
  var index = Math.floor((360 - (degrees % 360)) / arcd) % names.length;

  // Stop light rays
  canvas.classList.remove('wheel-spinning');
  document.getElementById('lightRays').style.display = 'none'; // ✅ hide effect

  // Evaluate result
  var text = names[index];
  var numericVal = parseInt(text, 10);

  if (isNaN(numericVal)) {
    showModal("RESULT", "😐", text, null);
    return;
  }
  if (numericVal >= 0) {
    showModal("CONGRATS!", "😃", "YOU WIN R" + numericVal, true);
    startRain(true);
    updateWinnings(numericVal);
  } else {
    showModal("OOPS!", "😞", "YOU LOST R" + Math.abs(numericVal), false);
    startRain(false);
    updateWinnings(numericVal);
  }
}

/* --------------------------------
   updateWinnings(amount)
   --------------------------------*/
function updateWinnings(amount) {
  var label = document.getElementById('totalWonLabel');
  var oldTotal = totalWinnings;
  var newTotal = totalWinnings + amount;

  // Flash color
  if (label) {
    label.style.color = (amount >= 0) ? "#4af0a4" : "#f04444";
  }

  var step = (amount >= 0) ? 1 : -1;
  var delay = 10;
  var currentValue = oldTotal;

  function doCount() {
    currentValue += step;
    if (label) {
      label.textContent = "Total Winnings: R" + currentValue;
    }

    var doneUp = (step > 0 && currentValue >= newTotal);
    var doneDown = (step < 0 && currentValue <= newTotal);

    if (doneUp || doneDown) {
      totalWinnings = newTotal;
      if (label) {
        label.style.color = "#ffc600"; // revert
      }
    } else {
      setTimeout(doCount, delay);
    }
  }
  doCount();
}

/* --------------------------------
   setCanvasSize()
   --------------------------------*/
   function setCanvasSize() {
    var containerWidth = canvas.parentElement.clientWidth;
    var containerHeight = window.innerHeight;
    var size = Math.min(containerWidth * 0.9, containerHeight * 0.5);
    canvas.width = size;
    canvas.height = size;

    var ContainerSize;
  
    if (window.innerWidth < 480) {
      ContainerSize = Math.min(containerWidth * 0.9, containerHeight * 0.5);
    } else {
      ContainerSize = Math.min(containerWidth * 0.9, containerHeight * 0.5);
    }
    wheelcontainer.width = ContainerSize;
    wheelcontainer.height = ContainerSize;    
  }

/* --------------------------------
   drawWheel()
   => also highlights the slice currently under the pointer
   --------------------------------*/
function drawWheel() {
  var outsideRadius = canvas.width / 2 - 10;
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (names.length === 0) {
    ctx.font = 'bold 24px Poppins, Arial';
    ctx.fillStyle = 'white';
    ctx.fillText("No slices!", centerX - 50, centerY);
    return;
  }

  var numSegments = names.length;
  arc = (2 * Math.PI) / numSegments;

  // Which slice is currently under the pointer
  var pointerDegrees = (startAngle * 180 / Math.PI + 90) % 360;
  var arcd = arc * 180 / Math.PI;
  var currentIndex = Math.floor((360 - pointerDegrees) / arcd) % numSegments;

  for (var i = 0; i < numSegments; i++) {
    var angle = startAngle + i * arc;
    var isCurrent = (i === currentIndex);
    var sliceColor = getSliceColor(names[i], isCurrent);

    ctx.fillStyle = sliceColor;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, outsideRadius, angle, angle + arc, false);
    ctx.lineTo(centerX, centerY);
    ctx.fill();

    // slice border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();

    // slice text
    ctx.save();
    var textAngle = angle + arc / 2;
    var textRadius = outsideRadius * 0.68;

    ctx.translate(
      centerX + Math.cos(textAngle) * textRadius,
      centerY + Math.sin(textAngle) * textRadius
    );
    ctx.rotate(textAngle);

    var fontSize = Math.floor(outsideRadius / 7);
    ctx.font = '600 ' + fontSize + 'px Poppins, Arial';

    var val = parseInt(names[i], 10);
    ctx.fillStyle = (val < 0) ? "#ffffff" : "#000000";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(names[i], 0, 0);
    ctx.restore();
  }

  // Draw pointer
  ctx.fillStyle = "#ffc600";
  ctx.beginPath();
  ctx.moveTo(centerX - 10, centerY - (outsideRadius + 10));
  ctx.lineTo(centerX + 10, centerY - (outsideRadius + 10));
  ctx.lineTo(centerX, centerY - (outsideRadius - 5));
  ctx.closePath();
  ctx.fill();
}

/* --------------------------------
   getSliceColor(valueStr, isHighlight)
   --------------------------------*/
function getSliceColor(valueStr, isHighlight) {
  var val = parseInt(valueStr, 10) || 0;

  // base colors
  var redBase = "#d00000";
  var goldBase = "#ffca28";
  // highlight colors
  var redHighlight = "#ff5f5f";
  var goldHighlight = "#ffe066";

  if (val < 0) {
    return isHighlight ? redHighlight : redBase;
  } else {
    return isHighlight ? goldHighlight : goldBase;
  }
}

/* --------------------------------
   Easing function for dramatic slow end
   => "easeOutExpo"
   --------------------------------*/
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* --------------------------------
   startRain(isWin)
   => money-bill confetti
   --------------------------------*/
function startRain(isWin) {
  var container = document.getElementById('confetti-container');
  if (!container) return;

  var emojiWin = "💵";
  var emojiLose = "💸";

  for (var i = 0; i < 50; i++) {
    var drop = document.createElement('div');
    drop.classList.add('confetti');
    drop.style.left = Math.random() * 100 + "%";
    drop.style.animationDelay = (Math.random() * 1) + 's';
    drop.textContent = isWin ? emojiWin : emojiLose;
    container.appendChild(drop);

    // Remove after ~2.5s
    setTimeout(function(el) {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 2500, drop);
  }
}

/* --------------------------------
   showModal(...)
   --------------------------------*/
function showModal(headerText, emoji, resultMessage, isPositive) {
  var modal = document.getElementById('modal');
  if (!modal) return;

  var modalHeader = document.getElementById('modal-header');
  var modalEmoji = document.getElementById('modal-emoji');
  var modalResult = document.getElementById('modal-result');
  var closeBtn = document.getElementById('closeModal');

  if (modalHeader) {
    modalHeader.textContent = headerText;
  }
  if (modalEmoji) {
    modalEmoji.textContent = emoji;
  }
  if (modalResult) {
    modalResult.textContent = resultMessage;
    if (isPositive === true) {
      modalResult.style.color = "#4af0a4"; // green
    } else if (isPositive === false) {
      modalResult.style.color = "#f04444"; // red
    } else {
      modalResult.style.color = "#fff";   // neutral
    }
  }

  modal.style.display = "flex";

  if (closeBtn) {
    closeBtn.onclick = function() {
      modal.style.display = "none";
    };
  }
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}
