import HomePresenter from './home-presenter';

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter({ view: this });
  }

  async render() {
    return `
      <section class="container">
        <h1>Home Page</h1>
        <div id="story-list" style="display: flex; flex-wrap: wrap; gap: 1rem;"></div>
        <div id="map" style="height: 400px; margin-top: 1rem;"></div>
      </section>
    `;
  }

  async afterRender() {
    this.storyList = document.getElementById('story-list');
    this.mapContainer = document.getElementById('map');
    await this.presenter.init();
  }

  showStories(stories) {
    if (stories.length === 0) {
      this.storyList.innerHTML = '<p>No stories available.</p>';
      return;
    }

    this.storyList.innerHTML = stories.map(story => `
      <div class="story-item" style="flex: 1 1 300px; border: 1px solid #ccc; padding: 1rem; border-radius: 8px; position: relative;">
        <img src="${story.photoUrl}" alt="${story.description || 'Story image'}" style="width: 100%; height: auto; border-radius: 4px;" />
        <p><strong>Description:</strong> ${story.description || '-'}</p>
        <p><strong>Created At:</strong> ${new Date(story.createdAt).toLocaleString()}</p>
        <button class="delete-btn" data-id="${story.id}" aria-label="Delete story" style="position: absolute; top: 8px; right: 8px; background: red; color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;">Delete</button>
      </div>
    `).join('');

    // Add event listeners for delete buttons
    this.storyList.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const id = event.target.getAttribute('data-id');
        if (id && this.presenter && typeof this.presenter.deleteStory === 'function') {
          this.presenter.deleteStory(id);
        }
      });
    });
  }

  async initMap(stories) {
    if (!window.L) {
      await this.loadLeaflet();
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.map = L.map(this.mapContainer).setView([-6.200000, 106.816666], 5); // Indonesia center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    stories.forEach(story => {
      if (story.lat !== null && story.lat !== undefined && story.lon !== null && story.lon !== undefined) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.map);
        marker.bindPopup(`
          <strong>${story.description || 'No description'}</strong><br/>
          Created At: ${new Date(story.createdAt).toLocaleString()}
        `);
      }
    });
  }

  loadLeaflet() {
    return new Promise((resolve) => {
      if (window.L) {
        resolve();
        return;
      }
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

  showError(message) {
    this.storyList.innerHTML = `<p>${message}</p>`;
  }
}
