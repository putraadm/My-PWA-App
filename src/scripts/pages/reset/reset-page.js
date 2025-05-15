export default class ResetPage {
  async render() {
    return `
      <section class="container">
        <h1>Password Reset</h1>
        <p>If you forgot your password, please contact support or register a new account as password reset is not supported by the API.</p>
        <form id="reset-form">
          <div>
            <label for="email">Enter your registered email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <button type="submit">Submit</button>
          <p id="message" style="color: green;"></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this.form = document.getElementById('reset-form');
    this.message = document.getElementById('message');
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = this.form.email.value.trim();
      this.message.textContent = `Password reset is not supported by the API. Please contact support or register a new account.`;
      console.log(`Password reset requested for email: ${email}`);
    });
  }
}
