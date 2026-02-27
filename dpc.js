// DPC Check - Data Classification Tool
// Classifies data sensitivity according to internal DPC policy (0-3)

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dpcForm');
    const resultContainer = document.getElementById('dpcResult');
    const resultCard = document.getElementById('dpcResultCard');
    const resetBtn = document.getElementById('dpcResetBtn');

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateDPC();
    });

    // Handle reset button
    resetBtn.addEventListener('click', resetForm);

    function calculateDPC() {
        // Get form values - Section 1: Datos Personales
        const q1 = document.querySelector('input[name="q1"]:checked')?.value;
        const q2 = document.querySelector('input[name="q2"]:checked')?.value;
        const q3 = document.querySelector('input[name="q3"]:checked')?.value;
        const q4 = document.querySelector('input[name="q4"]:checked')?.value;

        // Get form values - Section 2: Clasificación Corporativa
        const confidentialityType = document.querySelector('input[name="confidentialityType"]:checked')?.value;
        const q6 = document.querySelector('input[name="q6"]:checked')?.value;
        const q7 = document.querySelector('input[name="q7"]:checked')?.value;
        const q8 = document.querySelector('input[name="q8"]:checked')?.value;

        // Validate all fields are answered
        if (!q1 || !q2 || !q3 || !q4 || !confidentialityType || !q6 || !q7 || !q8) {
            alert('Por favor, responde todas las preguntas antes de enviar.');
            return;
        }

        // Track if DPC-3 is driven by personal data sensitivity
        let isDrivenByPersonalData = false;

        // PRIORITY OVERRIDE RULES (deterministic classification)
        // Rule 1: Confidential + High Impact = DPC-3 (automatic escalation)
        if (confidentialityType === 'confidencial' && q7 === 'high') {
            const finalDPC = 3;
            displayResult(finalDPC, q8, isDrivenByPersonalData, confidentialityType);
            setTimeout(() => {
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }

        // Rule 2: Secrets detected = DPC-3 (always prohibit)
        if (q8 === 'yes') {
            const finalDPC = 3;
            displayResult(finalDPC, q8, isDrivenByPersonalData, confidentialityType);
            setTimeout(() => {
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            return;
        }

        // Calculate personal data score (Section 1)
        let personalScore = 0;

        if (q4 === 'yes') {
            // Health/religion/biometric data → DPC 3
            personalScore = 3;
            isDrivenByPersonalData = true;
        } else if (q3 === 'yes') {
            // Sensitive client/private data → DPC 2
            personalScore = 2;
            isDrivenByPersonalData = true;
        } else if (q1 === 'yes') {
            // Contains personal data → DPC 1
            personalScore = 1;
        } else {
            // No personal data → DPC 0
            personalScore = 0;
        }

        // Calculate corporate score based on helper questions (Section 2)
        let corporateScore = 0;

        // If public already or low impact → lower risk
        if (q6 === 'yes' && q7 === 'low') {
            corporateScore = 0;
        }
        // If high impact → high confidentiality
        else if (q7 === 'high') {
            corporateScore = 2;
        }
        // If medium impact → medium confidentiality
        else if (q7 === 'medium') {
            corporateScore = 1;
        }
        // Low impact → low confidentiality
        else if (q7 === 'low') {
            corporateScore = 1;
        }

        // Calculate final DPC = MAX(personalScore, corporateScore)
        let finalDPC = Math.max(personalScore, corporateScore);

        // ESCALATION RULE: Restringida (Privada) information without public acknowledgment
        // If classified as Privada AND not publicly disclosed → minimum DPC-2
        if (confidentialityType === 'privada' && q6 === 'no') {
            finalDPC = Math.max(finalDPC, 2);
        }

        // ESCALATION RULE: Confidential information always requires DPC-3
        // Confidencial classification is highest sensitivity tier regardless of context
        if (confidentialityType === 'confidencial') {
            finalDPC = Math.max(finalDPC, 3);
        }

        // Compute confidentiality level based on helper questions
        const confidentialityLevel = computeConfidentialityLevel(q6, q7, q8);

        // Display result with DPC and confidentiality type (Q5)
        displayResult(finalDPC, q8, isDrivenByPersonalData, confidentialityType);

        // Scroll to result
        setTimeout(() => {
            resultContainer.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    function computeConfidentialityLevel(q6, q7, q8) {
        // If contains secrets → Confidencial
        if (q8 === 'yes') {
            return 'Confidencial';
        }
        // If public already → Interna
        if (q6 === 'yes') {
            return 'Interna';
        }
        // If high impact → Confidencial
        if (q7 === 'high') {
            return 'Confidencial';
        }
        // If medium impact → Privada
        if (q7 === 'medium') {
            return 'Privada';
        }
        // Default: Interna
        return 'Interna';
    }



    function displayResult(dpc, hasSecrets, isDrivenByPersonalData, confidentialityType) {
        let status = {};

        // Map Q5 (confidentialityType) to display subtitle - MUST reflect Q5 directly
        let q5DisplayLabel = 'Interna';  // default for 'interna'
        if (confidentialityType === 'privada') {
            q5DisplayLabel = 'Privada / Restringida';
        } else if (confidentialityType === 'confidencial') {
            q5DisplayLabel = 'Confidencial';
        }

        // Determine the appropriate label based on DPC level and source
        let resultLabel = '';
        
        if (isDrivenByPersonalData && dpc === 3) {
            // Personal data-driven DPC-3: show personal data label instead of corporate classification
            resultLabel = 'DPC 3 • Categoría especial';
        } else if (isDrivenByPersonalData && dpc === 2) {
            // Personal data-driven DPC-2: show personal data label
            resultLabel = 'DPC 2 • Datos sensibles';
        } else {
            // Corporate-driven or standard cases: show Q5-based classification
            resultLabel = `DPC ${dpc} • ${q5DisplayLabel}`;
        }

        if (dpc === 0 || dpc === 1) {
            status.class = 'dpcResultCard--permitido';
            status.icon = '✅';
            status.title = 'Permitido';
            status.label = resultLabel;
            status.recommendation = 'Puedes usar esta información en ChatGPT Enterprise sin restricciones.';
        } else if (dpc === 2) {
            status.class = 'dpcResultCard--limitado';
            status.icon = '⚠️';
            status.title = 'Uso Limitado';
            status.label = resultLabel;
            status.recommendation = 'Usa esta información con precaución. Sigue las políticas internas de tu equipo.';
        } else if (dpc === 3) {
            status.class = 'dpcResultCard--prohibido';
            status.icon = '❌';
            status.title = 'Prohibido';
            status.label = resultLabel;
            status.recommendation = 'No uses esta información en ChatGPT Enterprise. Datos altamente sensibles.';
        }

        // Build specific recommendations based on Q5 classification and personal data
        let detailedRecommendation = '';
        
        if (hasSecrets === 'yes') {
            detailedRecommendation = '🔴 ALERTA CRÍTICA: No pegar credenciales, contraseñas, tokens o secretos. Sanitiza toda la información antes de usar.';
        } else if (isDrivenByPersonalData && dpc === 3) {
            detailedRecommendation = '🔴 Datos Personales Sensibles (Categoría Especial): No compartas información de salud, religión, origen étnico, datos biométricos o similar. Datos altamente protegidos.';
        } else if (isDrivenByPersonalData && dpc === 2) {
            detailedRecommendation = '🟡 Datos Personales Sensibles: Limita el contexto compartido. Anonimiza nombres, referencias personales y números específicos.';
        } else if (confidentialityType === 'confidencial') {
            detailedRecommendation = '🔴 Información Confidencial: Úsala solo con resúmenes u abstracciones. Nunca pases documentos completos o datos específicos.';
        } else if (confidentialityType === 'privada') {
            detailedRecommendation = '🟡 Información Restringida (Privada): Limita el contexto compartido. Anonimiza nombres, referencias internas y números específicos.';
        } else if (confidentialityType === 'interna') {
            detailedRecommendation = '🟢 Información Interna: Puedes usarla con precaución. Sigue siempre las políticas de seguridad de tu organización.';
        }

        // Build result HTML
        resultCard.innerHTML = '';
        resultCard.classList.remove('dpcResultCard--permitido', 'dpcResultCard--limitado', 'dpcResultCard--prohibido');
        resultCard.classList.add(status.class);

        // Create result elements with safe DOM methods
        const iconDiv = document.createElement('div');
        iconDiv.className = 'dpcResultIcon';
        iconDiv.textContent = status.icon;

        const titleDiv = document.createElement('div');
        titleDiv.className = 'dpcResultTitle';
        titleDiv.textContent = status.title;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'dpcResultLabel';
        labelDiv.textContent = status.label;

        const recommendationDiv = document.createElement('div');
        recommendationDiv.className = 'dpcResultRecommendation';
        recommendationDiv.textContent = status.recommendation;

        const detailedDiv = document.createElement('div');
        detailedDiv.className = 'dpcResultDetailed';
        detailedDiv.textContent = detailedRecommendation;

        resultCard.appendChild(iconDiv);
        resultCard.appendChild(titleDiv);
        resultCard.appendChild(labelDiv);
        resultCard.appendChild(recommendationDiv);
        resultCard.appendChild(detailedDiv);

        // Show result
        resultContainer.classList.remove('dpcResult--hidden');
        form.classList.add('dpcForm--hidden');
    }

    function resetForm() {
        form.reset();
        resultContainer.classList.add('dpcResult--hidden');
        form.classList.remove('dpcForm--hidden');
        form.scrollIntoView({ behavior: 'smooth' });
    }
});
