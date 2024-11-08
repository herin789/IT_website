
function addSlider() {
    const image = document.getElementById("sliderImage").value;
    const title = document.getElementById("sliderTitle").value;
    const description = document.getElementById("sliderDescription").value;
    
    const sliderData = { image, title, description };
    
    // Get existing sliders from localStorage
    let sliders = JSON.parse(localStorage.getItem("sliders")) || [];
    sliders.push(sliderData);
    
    localStorage.setItem("sliders", JSON.stringify(sliders));
    
    alert("Slider added successfully!");
    document.getElementById("sliderForm").reset();
}

        