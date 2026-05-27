const steps = document.querySelectorAll("main > div");
const nextButtons = document.querySelectorAll(".next");

let currentStep = 0;

// toon eerste stap
steps[currentStep].classList.add("active");

nextButtons.forEach(button => {
    button.addEventListener("click", () => {
        // verberg huidige stap
        steps[currentStep].classList.remove("active");

        // ga naar volgende stap
        currentStep++;

        // toon volgende stap (als die bestaat)
        if (currentStep < steps.length) {
            steps[currentStep].classList.add("active");
        }
    });
});