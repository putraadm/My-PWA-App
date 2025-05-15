import AddPresenter from './add-presenter';

export default class AddPage {
  constructor() {
    this.presenter = new AddPresenter({ view: this });
  }

  async render() {
    return `
      <section class="container">
        <h1>Add New Story</h1>
        <form id="add-story-form">
          <div>
            <label for="description">Description:</label>
            <textarea id="description" name="description" required></textarea>
          </div>
          <div>
            <label for="photo">Photo:</label>
            <video id="video" width="320" height="240" autoplay></video>
            <button type="button" id="capture-button">Capture Photo</button>
            <canvas id="canvas" width="320" height="240" style="display:none;"></canvas>
            <img id="photo-preview" alt="Photo preview" />
          </div>
          <div>
            <label for="map">Select Location:</label>
            <div id="map" style="height: 300px;"></div>
            <div>
              <label for="lat">Latitude:</label>
              <input type="text" id="lat" name="lat" required />
            </div>
            <div>
              <label for="lon">Longitude:</label>
              <input type="text" id="lon" name="lon" required />
            </div>
          </div>
          <button type="submit">Submit</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    this.photoPreview = document.getElementById('photo-preview');
    this.captureButton = document.getElementById('capture-button');
    this.latInput = document.getElementById('lat');
    this.lonInput = document.getElementById('lon');
    this.form = document.getElementById('add-story-form');

    await this.presenter.init();

    this.captureButton.addEventListener('click', () => this.capturePhoto());
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));

    this.latInput.addEventListener('change', () => this.updateMarkerFromInputs());
    this.lonInput.addEventListener('change', () => this.updateMarkerFromInputs());
  }

  startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          this.video.srcObject = stream;
          this.stream = stream;
        })
        .catch((err) => {
          console.error('Error accessing camera:', err);
        });
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  capturePhoto() {
    const context = this.canvas.getContext('2d');
    context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    const dataUrl = this.canvas.toDataURL('image/png');
    this.photoPreview.src = dataUrl;
    this.photoPreview.style.display = 'block';
    this.stopCamera();
  }

  async loadLeaflet() {
    if (!window.L) {
      await new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js';
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    }
  }

  initMap() {
    this.map = L.map('map').setView([-6.200000, 106.816666], 13); // Default to Jakarta

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = null;

    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map);
      }
      this.latInput.value = lat.toFixed(6);
      this.lonInput.value = lng.toFixed(6);
    });
  }

  updateMarkerFromInputs() {
    const lat = parseFloat(this.latInput.value);
    const lon = parseFloat(this.lonInput.value);
    if (!isNaN(lat) && !isNaN(lon)) {
      const latLng = L.latLng(lat, lon);
      if (this.marker) {
        this.marker.setLatLng(latLng);
      } else {
        this.marker = L.marker(latLng).addTo(this.map);
      }
      this.map.setView(latLng, this.map.getZoom());
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    const description = document.getElementById('description').value;
    const lat = this.latInput.value;
    const lon = this.lonInput.value;

    if (!this.photoPreview.src) {
      alert('Please capture a photo.');
      return;
    }

    const blob = this.dataURLtoBlob(this.photoPreview.src);

    await this.presenter.submitStory({ photoBlob: blob, description, lat, lon });
  }

  resetForm() {
    this.form.reset();
    this.photoPreview.src = '';
    if (this.marker) {
      this.map.removeLayer(this.marker);
      this.marker = null;
    }
    this.latInput.value = '';
    this.lonInput.value = '';
  }

  showSuccess(message) {
    alert(message);
  }

  showError(message) {
    alert(message);
  }

  dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}
