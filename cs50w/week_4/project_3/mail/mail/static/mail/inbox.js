document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);
  function send_email(event) {
    event.preventDefault();

    fetch('/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        // After sending, load the sent mailbox to see your sent email
        load_mailbox('sent');
      })
      .catch(error => {
        console.error(error);
      });
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';



  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch('/emails/inbox')
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      return response.json();
    })
    .then(emails => {
      console.log('Emails received:', emails);
      console.log('Number of emails:', emails.length);

      document.querySelector('#emails-view').innerHTML = '';

      emails.forEach(email => {
        const emailElement = document.createElement('div');
        emailElement.classList.add('email');
        emailElement.innerHTML = `
          <div class="email-header">
            <h4 class="email-subject">${email.subject}</h4>
            <span class="email-timestamp">${email.timestamp}</span>
          </div>
          <p class="email-sender">From: ${email.sender}</p>
          <p class="email-preview">${email.body.substring(0, 100)}...</p>
        `;
        emailElement.addEventListener('click', () => { view_email(email.id); });
        document.querySelector('#emails-view').appendChild(emailElement);
      });
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}

function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block';

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#email-detail-view').innerHTML = `
      <button class="btn btn-sm btn-outline-primary" id="back-to-inbox">← Back to Inbox</button>
      <div class="email-detail">
        <h2>${email.subject}</h2>
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Timestamp:</strong> ${email.timestamp}</p>
        <hr>
        <div class="email-body">${email.body}</div>
      </div>
    `;
      
      // Add event listener to the back button
      document.querySelector('#back-to-inbox').addEventListener('click', () => {
        load_mailbox('inbox');
      });
    });
}


