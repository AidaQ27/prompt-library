/**
 * DPC Classification Logic - Unit Tests
 * Tests core DPC calculation rules and edge cases
 * 
 * To run tests: Open browser console while on dpc.html and run:
 *   runDPCTests();
 */

// Test data structure
const DPCTestCases = [
    {
        name: 'REGRESSION: Personal Data Override - All Personal Sensitive (Q1-Q4 Sí) = DPC-3 "Categoría especial"',
        inputs: {
            q1: 'yes', q2: 'yes', q3: 'yes', q4: 'yes',
            confidentialityType: 'interna',
            q6: 'no', q7: 'low', q8: 'no'
        },
        expectedDPC: 3,
        expectedLabel: 'DPC 3 • Categoría especial',
        expectedIsDrivenByPersonalData: true,
        reason: 'Personal data sensitivity (especially Q4) must show "Categoría especial" label, not corporate classification'
    },
    {
        name: 'REGRESSION: Confidencial + No Public + Bajo Impact MUST = DPC-3',
        inputs: {
            q1: 'no', q2: 'no', q3: 'no', q4: 'no',
            confidentialityType: 'confidencial',
            q6: 'no', q7: 'low', q8: 'no'
        },
        expectedDPC: 3,
        expectedLabel: 'DPC 3 • Confidencial',
        expectedIsDrivenByPersonalData: false,
        reason: 'Confidencial classification is hardcoded minimum DPC-3 regardless of impact or public status'
    },
    {
        name: 'REGRESSION: Privada + No Public + Medio Impact = DPC-2',
        inputs: {
            q1: 'no', q2: 'no', q3: 'no', q4: 'no',
            confidentialityType: 'privada',
            q6: 'no', q7: 'medium', q8: 'no'
        },
        expectedDPC: 2,
        expectedLabel: 'DPC 2 • Privada / Restringida',
        expectedIsDrivenByPersonalData: false,
        reason: 'Privada classification without public acknowledgment requires minimum DPC-2'
    },
    {
        name: 'Privada + Public + Medio = DPC-1',
        inputs: {
            q1: 'no', q2: 'no', q3: 'no', q4: 'no',
            confidentialityType: 'privada',
            q6: 'yes', q7: 'medium', q8: 'no'
        },
        expectedDPC: 1,
        expectedLabel: 'DPC 1 • Privada / Restringida',
        expectedIsDrivenByPersonalData: false,
        reason: 'Public acknowledgment lowers risk regardless of classification'
    },
    {
        name: 'Privada + No Public + Low = DPC-2',
        inputs: {
            q1: 'no', q2: 'no', q3: 'no', q4: 'no',
            confidentialityType: 'privada',
            q6: 'no', q7: 'low', q8: 'no'
        },
        expectedDPC: 2,
        expectedLabel: 'DPC 2 • Privada / Restringida',
        expectedIsDrivenByPersonalData: false,
        reason: 'Privada + No Public always escalates to minimum DPC-2'
    },
    {
        name: 'Interna + No Public + Medio = DPC-1',
        inputs: {
            q1: 'no', q2: 'no', q3: 'no', q4: 'no',
            confidentialityType: 'interna',
            q6: 'no', q7: 'medium', q8: 'no'
        },
        expectedDPC: 1,
        expectedLabel: 'DPC 1 • Privada',
        expectedIsDrivenByPersonalData: false,
        reason: 'Interna classification does not trigger Privada escalation rule'
    },
    {
        name: 'Personal Data Override: Health + Low Corporate = DPC-3 "Categoría especial"',
        inputs: {
            q1: 'no', q2: 'no', q3: 'no', q4: 'yes', // Health data
            confidentialityType: 'interna',
            q6: 'yes', q7: 'low', q8: 'no'
        },
        expectedDPC: 3,
        expectedLabel: 'DPC 3 • Categoría especial',
        expectedIsDrivenByPersonalData: true,
        reason: 'Personal health data (Q4) forces DPC-3 with "Categoría especial" label'
    },
    {
        name: 'Sensitive Client Data: DPC-2 "Datos sensibles"',
        inputs: {
            q1: 'no', q2: 'no', q3: 'yes', q4: 'no', // Sensitive client data
            confidentialityType: 'interna',
            q6: 'yes', q7: 'low', q8: 'no'
        },
        expectedDPC: 2,
        expectedLabel: 'DPC 2 • Datos sensibles',
        expectedIsDrivenByPersonalData: true,
        reason: 'Sensitive client/private data (Q3) forces DPC-2 with personal data label'
    },
    {
        name: 'Personal Data + Privada No Public = DPC-2 "Datos sensibles"',
        inputs: {
            q1: 'yes', q2: 'no', q3: 'no', q4: 'no', // Contains personal data
            confidentialityType: 'privada',
            q6: 'no', q7: 'low', q8: 'no'
        },
        expectedDPC: 2,
        expectedLabel: 'DPC 2 • Datos sensibles',
        expectedIsDrivenByPersonalData: true,
        reason: 'Personal data (at least Q1) with Privada + No Public = DPC-2 with personal data label'
    }
];
// Mock simulation function (since we can't directly call calculateDPC without DOM)
function simulateDPCCalculation(inputs) {
    const {q1, q2, q3, q4, confidentialityType, q6, q7, q8} = inputs;

    // Track if DPC is driven by personal data sensitivity
    let isDrivenByPersonalData = false;

    // PRIORITY OVERRIDE RULES
    if (confidentialityType === 'confidencial' && q7 === 'high') {
        return {finalDPC: 3, isDrivenByPersonalData: false, label: 'DPC 3 • Confidencial', description: 'Override: Confidencial + High'};
    }

    if (q8 === 'yes') {
        return {finalDPC: 3, isDrivenByPersonalData: false, label: 'DPC 3 • Confidencial', description: 'Override: Secrets detected'};
    }

    // Calculate personal data score
    let personalScore = 0;
    if (q4 === 'yes') {
        personalScore = 3;
        isDrivenByPersonalData = true;
    } else if (q3 === 'yes') {
        personalScore = 2;
        isDrivenByPersonalData = true;
    } else if (q1 === 'yes') {
        personalScore = 1;
    } else {
        personalScore = 0;
    }

    // Calculate corporate score
    let corporateScore = 0;
    if (q6 === 'yes' && q7 === 'low') {
        corporateScore = 0;
    } else if (q7 === 'high') {
        corporateScore = 2;
    } else if (q7 === 'medium') {
        corporateScore = 1;
    } else if (q7 === 'low') {
        corporateScore = 1;
    }

    // BASE DPC
    let finalDPC = Math.max(personalScore, corporateScore);

    // ESCALATION RULE: Privada + No Public = minimum DPC-2
    if (confidentialityType === 'privada' && q6 === 'no') {
        finalDPC = Math.max(finalDPC, 2);
    }

    // ESCALATION RULE: Confidential information always requires DPC-3
    if (confidentialityType === 'confidencial') {
        finalDPC = Math.max(finalDPC, 3);
    }

    // Map Q5 (confidentialityType) to display subtitle - MUST reflect Q5 directly
    let q5DisplayLabel = 'Interna';  // default for 'interna'
    if (confidentialityType === 'privada') {
        q5DisplayLabel = 'Privada / Restringida';
    } else if (confidentialityType === 'confidencial') {
        q5DisplayLabel = 'Confidencial';
    }

    // Determine the appropriate label based on DPC level and source
    let resultLabel = '';
    if (isDrivenByPersonalData && finalDPC === 3) {
        resultLabel = 'DPC 3 • Categoría especial';
    } else if (isDrivenByPersonalData && finalDPC === 2) {
        resultLabel = 'DPC 2 • Datos sensibles';
    } else {
        resultLabel = `DPC ${finalDPC} • ${q5DisplayLabel}`;
    }

    return {finalDPC, isDrivenByPersonalData, label: resultLabel, description: 'Normal calculation'};
}

// Test runner
function runDPCTests() {
    console.log('%c=== DPC Classification Test Suite ===', 'font-size: 16px; font-weight: bold; color: #0066cc;');
    
    let passedTests = 0;
    let failedTests = 0;
    const failures = [];

    DPCTestCases.forEach((testCase, index) => {
        const result = simulateDPCCalculation(testCase.inputs);
        const dpcMatch = result.finalDPC === testCase.expectedDPC;
        const labelMatch = result.label === testCase.expectedLabel;
        const personalDataMatch = result.isDrivenByPersonalData === testCase.expectedIsDrivenByPersonalData;
        const testPassed = dpcMatch && labelMatch && personalDataMatch;

        if (testPassed) {
            console.log(`%c✓ Test ${index + 1}: ${testCase.name}`, 'color: green; font-weight: bold;');
            passedTests++;
        } else {
            console.log(`%c✗ Test ${index + 1}: ${testCase.name}`, 'color: red; font-weight: bold;');
            failedTests++;
            failures.push({
                testName: testCase.name,
                expected: {dpc: testCase.expectedDPC, label: testCase.expectedLabel, isDrivenByPersonalData: testCase.expectedIsDrivenByPersonalData},
                actual: {dpc: result.finalDPC, label: result.label, isDrivenByPersonalData: result.isDrivenByPersonalData},
                inputs: testCase.inputs,
                reason: testCase.reason
            });
        }

        // Log inputs and expected values
        console.log(`  Inputs: Q1=${testCase.inputs.q1}, Q2=${testCase.inputs.q2}, Q3=${testCase.inputs.q3}, Q4=${testCase.inputs.q4}, Q5=${testCase.inputs.confidentialityType}, Q6=${testCase.inputs.q6}, Q7=${testCase.inputs.q7}, Q8=${testCase.inputs.q8}`);
        console.log(`  Expected: "${testCase.expectedLabel}" (Personal Data Driven: ${testCase.expectedIsDrivenByPersonalData}) | Got: "${result.label}" (Personal Data Driven: ${result.isDrivenByPersonalData})`);
        console.log(`  Reason: ${testCase.reason}`);
        console.log('');
    });

    // Summary
    console.log('%c=== Test Summary ===', 'font-size: 14px; font-weight: bold; color: #0066cc;');
    console.log(`%cPassed: ${passedTests}/${DPCTestCases.length}`, passedTests === DPCTestCases.length ? 'color: green; font-size: 12px;' : 'color: orange; font-size: 12px;');
    console.log(`%cFailed: ${failedTests}/${DPCTestCases.length}`, failedTests === 0 ? 'color: green; font-size: 12px;' : 'color: red; font-size: 12px;');

    if (failures.length > 0) {
        console.log('%c=== FAILURES ===', 'color: red; font-weight: bold; font-size: 12px;');
        failures.forEach(failure => {
            console.log(`\n❌ ${failure.testName}`);
            console.log(`   Expected: "${failure.expected.label}" (Personal Data: ${failure.expected.isDrivenByPersonalData})`);
            console.log(`   Got:      "${failure.actual.label}" (Personal Data: ${failure.actual.isDrivenByPersonalData})`);
            console.log(`   Reason:   ${failure.reason}`);
        });
    }

    return {passed: passedTests, failed: failedTests, total: DPCTestCases.length};
}

// Make test runner globally available
window.runDPCTests = runDPCTests;

console.log('%c✓ DPC Test Suite loaded. Run: runDPCTests()', 'color: green;');