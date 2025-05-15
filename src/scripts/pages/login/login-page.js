import { loginUser } from '../../data/api';

export default class LoginPage {
  async render() {
    const storedEmail = localStorage.getItem('storedEmail') || '';
    return `
      <section class="container">
        <h1>Login</h1>
        <form id="login-form">
          <div>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" value="${storedEmail}" required />
          </div>
          <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required minlength="8" />
          </div>
          <button type="submit">Login</button>
          <p id="error-message" style="color: red;"></p>
        </form>
        <button id="logout-button" style="margin-top: 10px;">Clear Stored Credentials (Logout)</button>
      </section>
    `;
  }

  async afterRender() {
    this.form = document.getElementById('login-form');
    this.errorMessage = document.getElementById('error-message');
    this.logoutButton = document.getElementById('logout-button');

    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = this.form.email.value.trim();
      const password = this.form.password.value;

      try {
        const result = await loginUser({ email, password });
        if (result.error === false && result.loginResult && result.loginResult.token) {
          localStorage.setItem('authToken', result.loginResult.token);
          localStorage.setItem('storedEmail', email);
          alert('Login successful!');
          window.location.hash = '#/';
        } else {
          this.errorMessage.textContent = 'Login failed: ' + (result.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Login error:', error);
        this.errorMessage.textContent = 'Login failed due to error.';
      }
    });

    this.logoutButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear stored credentials and logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('storedEmail');
        alert('Stored credentials cleared.');
        window.location.hash = '#/login';
      }
    });
  }
}
