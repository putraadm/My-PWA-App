import CONFIG from '../config';

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export async function getStories() {
  try {
    const response = await fetch(ENDPOINTS.STORIES, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch stories');
    }
    const data = await response.json();
    return data.listStory || [];
  } catch (error) {
    console.error('Error in getStories:', error);
    return [];
  }
}

export async function addStory({ photo, description, lat, lon }) {
  try {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('description', description);
    
    if (lat !== undefined && lon !== undefined) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }

    const headers = getAuthHeaders();

    const response = await fetch(headers['Authorization'] ? ENDPOINTS.STORIES : ENDPOINTS.STORIES_GUEST, {
      method: 'POST',
      headers: {
        ...headers,
      
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to add story');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in addStory:', error);
    throw error; 
  }
}

export async function deleteStory(storyId) {
  try {
    const headers = getAuthHeaders();
    const url = `${ENDPOINTS.STORIES}/${encodeURIComponent(storyId)}`;
    console.log('Deleting story with URL:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete story');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in deleteStory:', error);
    throw error;
  }
}

export async function registerUser ({ name, email, password }) {
  try {
    console.log('Registering user:', { name, email, password });
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register user');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in registerUser :', error);
    throw error;
  }
}

export async function loginUser ({ email, password }) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to login');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in loginUser :', error);
    throw error;
  }
}
