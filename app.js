// Global state
let pricingData = {};
let selectedWebsiteType = '';
let selectedFeatures = new Set();
let selectedServices = new Set();

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadPricingData();
    renderOptions();
});

// Load pricing data from backend
async function loadPricingData() {
    try {
        const response = await fetch('/api/pricing');
        pricingData = await response.json();
        console.log('Pricing data loaded:', pricingData);
    } catch (error) {
        console.error('Error loading pricing data:', error);
    }
}

// Render all options
function renderOptions() {
    renderWebsiteTypes();
    renderFeatures();
    renderServices();
}

// Render website type options
function renderWebsiteTypes() {
    const container = document.getElementById('websiteTypeOptions');
    container.innerHTML = '';

    for (const [type, data] of Object.entries(pricingData.website_types)) {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        
        col.innerHTML = `
            <div class="card feature-card h-100 ${selectedWebsiteType === type ? 'selected' : ''}" 
                 onclick="selectWebsiteType('${type}')">
                <div class="card-body text-center">
                    <h6 class="card-title">${type.charAt(0).toUpperCase() + type.slice(1)}</h6>
                    <p class="card-text small text-muted">${data.description}</p>
                    <div class="fw-bold text-primary">$${data.base_price}</div>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    }
}

// Render feature options
function renderFeatures() {
    const container = document.getElementById('featuresOptions');
    container.innerHTML = '';

    for (const [feature, data] of Object.entries(pricingData.features)) {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';
        const isSelected = selectedFeatures.has(feature);
        
        col.innerHTML = `
            <div class="card feature-card h-100 ${isSelected ? 'selected' : ''}" 
                 onclick="toggleFeature('${feature}')">
                <div class="card-body">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               ${isSelected ? 'checked' : ''}
                               onchange="toggleFeature('${feature}')">
                        <label class="form-check-label fw-bold">
                            ${formatFeatureName(feature)}
                        </label>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <small class="text-muted">${data.category}</small>
                            <span class="badge bg-success">+$${data.price}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    }
}

// Render service options
function renderServices() {
    const container = document.getElementById('servicesOptions');
    container.innerHTML = '';

    for (const [service, data] of Object.entries(pricingData.additional_services)) {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';
        const isSelected = selectedServices.has(service);
        
        col.innerHTML = `
            <div class="card feature-card h-100 ${isSelected ? 'selected' : ''}" 
                 onclick="toggleService('${service}')">
                <div class="card-body">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               ${isSelected ? 'checked' : ''}
                               onchange="toggleService('${service}')">
                        <label class="form-check-label fw-bold">
                            ${formatFeatureName(service)}
                        </label>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <small class="text-muted">${data.description}</small>
                            <span class="badge bg-warning text-dark">+$${data.monthly_price}/mo</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(col);
    }
}

// Selection handlers
function selectWebsiteType(type) {
    selectedWebsiteType = type;
    renderOptions();
    calculateEstimate();
}

function toggleFeature(feature) {
    if (selectedFeatures.has(feature)) {
        selectedFeatures.delete(feature);
    } else {
        selectedFeatures.add(feature);
    }
    renderOptions();
    calculateEstimate();
}

function toggleService(service) {
    if (selectedServices.has(service)) {
        selectedServices.delete(service);
    } else {
        selectedServices.add(service);
    }
    renderOptions();
    calculateEstimate();
}

// Calculate and display estimate
async function calculateEstimate() {
    if (!selectedWebsiteType) {
        updatePriceDisplay(0, 0, {});
        return;
    }

    try {
        const requestData = {
            website_type: selectedWebsiteType,
            selected_features: Array.from(selectedFeatures),
            selected_services: Array.from(selectedServices),
            custom_requirements: document.getElementById('customRequirements').value
        };

        const response = await fetch('/api/estimate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        const estimate = await response.json();
        updatePriceDisplay(estimate.total_one_time, estimate.services_monthly, estimate.breakdown);
        
    } catch (error) {
        console.error('Error calculating estimate:', error);
    }
}

// Update the price display
function updatePriceDisplay(total, monthly, breakdown) {
    // Update total price
    document.getElementById('totalPrice').textContent = `$${total}`;
    
    // Update monthly cost
    const monthlyElement = document.getElementById('monthlyCost');
    const monthlyPriceElement = document.getElementById('monthlyPrice');
    
    if (monthly > 0) {
        monthlyElement.style.display = 'block';
        monthlyPriceElement.textContent = monthly;
    } else {
        monthlyElement.style.display = 'none';
    }
    
    // Update breakdown
    const breakdownContent = document.getElementById('breakdownContent');
    
    if (Object.keys(breakdown).length === 0) {
        breakdownContent.innerHTML = '<p class="text-muted">Select options to see breakdown</p>';
        return;
    }
    
    let breakdownHTML = '';
    
    // Base website
    if (breakdown.base_website) {
        breakdownHTML += `
            <div class="breakdown-item">
                <div class="d-flex justify-content-between">
                    <span>Base Website</span>
                    <span class="fw-bold">$${breakdown.base_website}</span>
                </div>
            </div>
        `;
    }
    
    // Features
    if (breakdown.features && Object.keys(breakdown.features).length > 0) {
        breakdownHTML += `<div class="mt-2"><strong>Features:</strong></div>`;
        for (const [feature, price] of Object.entries(breakdown.features)) {
            breakdownHTML += `
                <div class="breakdown-item small">
                    <div class="d-flex justify-content-between">
                        <span>${formatFeatureName(feature)}</span>
                        <span>+$${price}</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Monthly services
    if (breakdown.services_monthly && Object.keys(breakdown.services_monthly).length > 0) {
        breakdownHTML += `<div class="mt-2"><strong>Monthly Services:</strong></div>`;
        for (const [service, price] of Object.entries(breakdown.services_monthly)) {
            breakdownHTML += `
                <div class="breakdown-item small">
                    <div class="d-flex justify-content-between">
                        <span>${formatFeatureName(service)}</span>
                        <span>+$${price}/mo</span>
                    </div>
                </div>
            `;
        }
    }
    
    breakdownContent.innerHTML = breakdownHTML;
}

// Helper function to format feature names
function formatFeatureName(name) {
    return name.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}