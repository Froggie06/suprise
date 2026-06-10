const steps = document.querySelectorAll("main > div");
const nextButtons = document.querySelectorAll(".next");
const backButtons = document.querySelectorAll(".back");
const runawayButton = document.querySelector(".runaway");
const dateOptions = document.querySelectorAll(".date-option");
const choiceNextButton = document.querySelector(".choice-next");
const dateInput = document.querySelector('input[name="date"]');
const timeSelect = document.querySelector("#time-select");
const submissionStatus = document.querySelector(".submission-status");

const googleForm = {
    url: "https://docs.google.com/forms/d/e/1FAIpQLSfom_JqGr2GwAEdUz8IExNzIAtzaVHifI3hkyyS2mKqHL-OdA/formResponse",
    entries: {
        date: "entry.353906162",
        time: "entry.1154854913",
        choice: "entry.1514630571"
    }
};

let currentStep = 0;
let runawayAnimation;
let runawayPosition = { x: 0, y: 0 };
let runawayTarget = { x: 0, y: 0 };
let selectedDateChoice = "";

// toon eerste stap
steps[currentStep].classList.add("active");

nextButtons.forEach(button => {
    button.addEventListener("click", async () => {
        const requiredFields = steps[currentStep].querySelectorAll("[required]");
        const allFieldsAreValid = [...requiredFields].every(field => field.reportValidity());

        if (!allFieldsAreValid) {
            return;
        }

        if (button.classList.contains("choice-next")) {
            await submitDateAnswer();
        }

        // verberg huidige stap
        steps[currentStep].classList.remove("active");

        // ga naar volgende stap
        currentStep++;

        // toon volgende stap
        if (currentStep < steps.length) {
            steps[currentStep].classList.add("active");
        }
    });
});

backButtons.forEach(button => {
    button.addEventListener("click", () => {
        if (currentStep === 0) {
            return;
        }

        steps[currentStep].classList.remove("active");
        currentStep--;
        steps[currentStep].classList.add("active");
    });
});

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function animateRunawayButton() {
    runawayPosition.x += (runawayTarget.x - runawayPosition.x) * 0.1;
    runawayPosition.y += (runawayTarget.y - runawayPosition.y) * 0.1;

    runawayButton.style.transform = `translate(${runawayPosition.x}px, ${runawayPosition.y}px)`;

    if (
        Math.abs(runawayTarget.x - runawayPosition.x) > 0.5 ||
        Math.abs(runawayTarget.y - runawayPosition.y) > 0.5
    ) {
        runawayAnimation = requestAnimationFrame(animateRunawayButton);
        return;
    }

    runawayPosition.x = runawayTarget.x;
    runawayPosition.y = runawayTarget.y;
    runawayButton.style.transform = `translate(${runawayPosition.x}px, ${runawayPosition.y}px)`;
    runawayAnimation = null;
}

function startRunawayAnimation() {
    if (!runawayAnimation) {
        runawayAnimation = requestAnimationFrame(animateRunawayButton);
    }
}

function hasGoogleFormConfig() {
    return googleForm.url && googleForm.entries.date && googleForm.entries.time && googleForm.entries.choice;
}

function getDateAnswer() {
    return {
        date: dateInput.value,
        time: timeSelect.value,
        choice: selectedDateChoice,
        submittedAt: new Date().toISOString()
    };
}

function getDayOfWeek(dateString) {
    if (!dateString) {
        return null;
    }

    return new Date(`${dateString}T00:00:00`).getDay();
}

function updateTimeOptions() {
    [...timeSelect.options].forEach(option => {
        option.disabled = false;
    });

    if (!dateInput.value) {
        return;
    }

    const selectedDay = getDayOfWeek(dateInput.value);
    const isFriday = selectedDay === 5;
    const isSunday = selectedDay === 0;
    const isWeekend = selectedDay === 6;
    const specificDateIsJune13 = dateInput.value === "2026-06-13";
    const minimumHour = specificDateIsJune13 ? 13 : isFriday ? 21 : isSunday ? 12 : isWeekend ? 18 : 16;

    [...timeSelect.options].forEach(option => {
        if (!option.value) {
            return;
        }

        const optionHour = Number(option.value);
        option.disabled = optionHour < minimumHour;
    });

    if (isFriday) {
        [...timeSelect.options].forEach(option => {
            option.disabled = option.value !== "21";
        });
    }

    if (isSunday) {
        [...timeSelect.options].forEach(option => {
            if (!option.value) {
                return;
            }
            option.disabled = false;
        });
    }

    if (timeSelect.value && Number(timeSelect.value) < minimumHour) {
        timeSelect.value = "";
    }
}

async function submitDateAnswer() {
    const answer = getDateAnswer();
    localStorage.setItem("askOnDateAnswer", JSON.stringify(answer));

    if (!hasGoogleFormConfig()) {
        if (submissionStatus) {
            submissionStatus.hidden = false;
            submissionStatus.textContent = "Saved on this device. Add your Google Form settings to save it in Sheets.";
        }
        return;
    }

    // UPDATE: We gebruiken URLSearchParams i.p.v. FormData omdat Google dit verplicht stelt voor externen
    const urlEncodedData = new URLSearchParams();
    
    // UPDATE: We sturen de datum en tijd nu in één keer op, precies zoals jouw formulier het verwacht!
    urlEncodedData.append(googleForm.entries.date, answer.date); 
    urlEncodedData.append(googleForm.entries.time, answer.time); 
    urlEncodedData.append(googleForm.entries.choice, answer.choice);

    try {
        await fetch(googleForm.url, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: urlEncodedData.toString()
        });

        if (submissionStatus) {
            submissionStatus.hidden = false;
            submissionStatus.textContent = "Saved.";
        }
    } catch {
        if (submissionStatus) {
            submissionStatus.hidden = false;
            submissionStatus.textContent = "Could not save online, but it is saved on this device.";
        }
    }
}

function moveRunawayButton(event) {
    const triggerDistance = 110;
    const minOffset = 12;
    const maxOffset = 85;
    const padding = 16;
    const buttonPosition = runawayButton.getBoundingClientRect();
    const originalCenterX = buttonPosition.left - runawayPosition.x + buttonPosition.width / 2;
    const originalCenterY = buttonPosition.top - runawayPosition.y + buttonPosition.height / 2;
    let distanceX = originalCenterX - event.clientX;
    let distanceY = originalCenterY - event.clientY;
    let distanceFromCursor = Math.hypot(distanceX, distanceY);

    if (distanceFromCursor > triggerDistance) {
        runawayTarget = { x: 0, y: 0 };
        startRunawayAnimation();
        return;
    }

    if (distanceFromCursor === 0) {
        distanceX = 1;
        distanceY = 1;
        distanceFromCursor = Math.hypot(distanceX, distanceY);
    }

    const strength = 1 - distanceFromCursor / triggerDistance;
    const offset = minOffset + strength * maxOffset;
    const targetX = (distanceX / distanceFromCursor) * offset;
    const targetY = (distanceY / distanceFromCursor) * offset;
    const minX = padding - originalCenterX + buttonPosition.width / 2;
    const maxX = window.innerWidth - padding - originalCenterX - buttonPosition.width / 2;
    const minY = padding - originalCenterY + buttonPosition.height / 2;
    const maxY = window.innerHeight - padding - originalCenterY - buttonPosition.height / 2;

    runawayButton.classList.add("is-running");
    runawayTarget = {
        x: clamp(targetX, minX, maxX),
        y: clamp(targetY, minY, maxY)
    };
    startRunawayAnimation();
}

if (runawayButton) {
    runawayButton.addEventListener("mouseenter", moveRunawayButton);
    runawayButton.addEventListener("click", event => {
        event.preventDefault();
        moveRunawayButton(event);
    });

    document.addEventListener("mousemove", event => {
        if (!runawayButton.closest(".askOnDate.active")) {
            return;
        }

        moveRunawayButton(event);
    });

    document.addEventListener("mouseleave", () => {
        runawayTarget = { x: 0, y: 0 };
        startRunawayAnimation();
    });
}

if (dateInput && timeSelect) {
    dateInput.addEventListener("change", updateTimeOptions);
    updateTimeOptions();
}

dateOptions.forEach(option => {
    option.addEventListener("click", () => {
        dateOptions.forEach(dateOption => {
            dateOption.classList.remove("selected");
        });

        option.classList.add("selected");
        selectedDateChoice = option.dataset.choice;
        choiceNextButton.hidden = false;
        choiceNextButton.disabled = false;
    });
});
