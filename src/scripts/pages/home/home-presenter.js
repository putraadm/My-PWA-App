import { getStories, addStory, deleteStory as apiDeleteStory } from '../../data/api';
import { getAllStoriesFromDB, addStoryToDB, deleteStoryFromDB } from '../../utils/indexeddb';

// Helper function to resize image blob using canvas
async function resizeImageBlob(blob, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) {
            resolve(resizedBlob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        },
        blob.type,
        quality
      );
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = URL.createObjectURL(blob);
  });
}

// Improved helper function to convert base64 data URL to Blob
function base64ToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const contentType = mimeMatch ? mimeMatch[1] : '';
  const base64Data = parts[1];
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  const sliceSize = 512;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

export default class HomePresenter {
  constructor({ view }) {
    this.view = view;
  }

  async init() {
    try {
      // Load stories from IndexedDB first
      const localStories = await getAllStoriesFromDB();
      if (localStories.length > 0) {
        this.view.showStories(localStories);
        this.view.initMap(localStories);
      }

      // Sync locally added stories to API
      for (const story of localStories) {
        if (!story.synced && !story.deleted) {
          try {
            // Prepare multipart/form-data for API
            const formData = new FormData();
            formData.append('description', story.description || '');
            if (story.lat !== undefined && story.lat !== null && story.lat !== '') {
              formData.append('lat', story.lat);
            }
            if (story.lon !== undefined && story.lon !== null && story.lon !== '') {
              formData.append('lon', story.lon);
            }

            // Convert photoBase64 to Blob if present
            let photoBlob = null;
            if (story.photoBase64) {
              photoBlob = base64ToBlob(story.photoBase64);
              console.log('Photo Blob size:', photoBlob.size, 'type:', photoBlob.type);
            }

            if (photoBlob) {
              // Log original photoBlob details
              console.log('Original photoBlob:', photoBlob);

              // Resize/compress image if larger than 1MB
              if (photoBlob.size > 1024 * 1024) {
                try {
                  photoBlob = await resizeImageBlob(photoBlob, 1024, 1024, 0.7);
                  console.log('Resized photoBlob:', photoBlob);
                } catch (err) {
                  console.error('Failed to resize photo blob:', err);
                  photoBlob = null;
                }
              }

              if (photoBlob && photoBlob.type.startsWith('image/')) {
                formData.append('photo', photoBlob, 'photo.png');
                console.log('Appended photoBlob to formData');
              } else {
                console.error('Photo blob is invalid or too large for syncing.');
              }
            }

            // Get token from localStorage
            const token = localStorage.getItem('authToken');

            // Send fetch request with multipart/form-data and Authorization header
            const res = await fetch('https://story-api.dicoding.dev/v1/stories', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (!res.ok) {
              const errorBody = await res.json();
              console.error('API error response:', errorBody);
              throw new Error('Failed to add story');
            }

            story.synced = true;
            await addStoryToDB(story);
          } catch (syncError) {
            console.error('Failed to sync story:', syncError);
          }
        }
      }

      // Fetch fresh stories from API
      const stories = await getStories();

      // Filter out locally deleted stories
      const deletedIds = localStories.filter(s => s.deleted).map(s => s.id);
      const filteredStories = stories.filter(s => !deletedIds.includes(s.id));

      // Merge local unsynced stories with API stories
      const unsyncedStories = localStories.filter(s => !s.synced && !s.deleted);
      const mergedStories = [...filteredStories, ...unsyncedStories];

      this.view.showStories(mergedStories);
      this.view.initMap(mergedStories);

      // Update IndexedDB with fresh stories
      for (const story of stories) {
        await addStoryToDB(story);
      }
    } catch (error) {
      this.view.showError('Failed to load stories.');
      console.error(error);
    }
  }

  async addStory(story) {
    try {
      await addStoryToDB({ ...story, synced: false, deleted: false });
      // Refresh view
      const stories = await getAllStoriesFromDB();
      this.view.showStories(stories);
      this.view.initMap(stories);
    } catch (error) {
      this.view.showError('Failed to add story.');
      console.error(error);
    }
  }

  async deleteStory(id) {
    try {
      // Mark story as deleted locally
      const stories = await getAllStoriesFromDB();
      const storyToDelete = stories.find(s => s.id === id);
      if (storyToDelete) {
        storyToDelete.deleted = true;
        await addStoryToDB(storyToDelete);
      }
      // Attempt to delete from API
      try {
        await apiDeleteStory(id);
      } catch (apiError) {
        console.error('Failed to delete story from API:', apiError);
      }
      // Refresh view
      const updatedStories = await getAllStoriesFromDB();
      this.view.showStories(updatedStories.filter(s => !s.deleted));
      this.view.initMap(updatedStories.filter(s => !s.deleted));
    } catch (error) {
      this.view.showError('Failed to delete story.');
      console.error(error);
    }
  }
}
