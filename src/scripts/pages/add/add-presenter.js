import { addStory } from '../../data/api';
import { addStoryToDB } from '../../utils/indexeddb';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default class AddPresenter {
  constructor({ view }) {
    this.view = view;
  }

  async init() {
    this.view.startCamera();
    await this.view.loadLeaflet();
    this.view.initMap();
  }

  async submitStory({ photoBlob, description, lat, lon }) {
    try {
      await addStory({
        photo: photoBlob,
        description,
        lat,
        lon,
      });
      this.view.showSuccess('Story added successfully!');
      this.view.resetForm();
      this.view.stopCamera();
      // Navigate to home page
      window.location.hash = '#/';
    } catch (error) {
      console.error('Error adding story:', error);
      // Save story to IndexedDB for offline support
      try {
        const photoBase64 = await blobToBase64(photoBlob);
        await addStoryToDB({
          id: Date.now().toString(),
          photoBase64,
          description,
          lat,
          lon,
          createdAt: new Date().toISOString(),
          synced: false,
          deleted: false,
        });
        this.view.showSuccess('Story saved locally. It will be synced when online.');
        this.view.resetForm();
        this.view.stopCamera();
        window.location.hash = '#/';
      } catch (dbError) {
        console.error('Error saving story locally:', dbError);
        this.view.showError('Failed to add story.');
      }
    }
  }
}
