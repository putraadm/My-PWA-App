import { registerUser, loginUser } from '../../data/api';

export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <h1>Register</h1>
        <form id="register-form">
          <div>
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required minlength="8" />
          </div>
          <button type="submit">Register</button>
          <p id="error-message" style="color: red;"></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.form = document.getElementById('register-form');
    this.errorMessage = document.getElementById('error-message');
    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = this.form.name.value;
      const email = this.form.email.value;
      const password = this.form.password.value;

      try {
        const result = await registerUser({ name, email, password });
        if (result.error === false) {
          alert('Registration successful! Please login.');
          window.location.hash = '#/login';
        } else {
          this.errorMessage.textContent = 'Registration failed: ' + (result.message || 'Unknown error');
        }
      } catch (error) {
        if (error.message === 'Email is already taken') {
          // Try to login automatically
          try {
            const loginResult = await loginUser({ email, password });
            if (loginResult.error === false && loginResult.loginResult && loginResult.loginResult.token) {
              localStorage.setItem('authToken', loginResult.loginResult.token);
              alert('Email already registered. Logged in successfully!');
              window.location.hash = '#/';
            } else {
              this.errorMessage.textContent = 'Login failed after registration: ' + (loginResult.message || 'Unknown error');
            }
          } catch (loginError) {
            this.errorMessage.textContent = 'Login failed after registration: ' + loginError.message;
          }
        } else {
          this.errorMessage.textContent = 'Registration failed: ' + error.message;
        }
      }
    });
  }
}
