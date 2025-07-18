<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
=======
document.addEventListener('DOMContentLoaded', function () {


>>>>>>> 62f8ccbe1d42263bb264fcf071c7f77649f0ee30
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

<<<<<<< HEAD
  // By default, load the inbox
  load_mailbox('inbox');
=======

  document.querySelector('#compose-form').onsubmit = (event) => {
    event.preventDefault();

    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
      .then(response => response.json())
      .then(result => {
        console.log(result);
        load_mailbox('sent');
      });

    return false; // Optional safeguard
  };

>>>>>>> 62f8ccbe1d42263bb264fcf071c7f77649f0ee30
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
<<<<<<< HEAD
=======
  document.querySelector('#sent-view').style.display = 'none';


>>>>>>> 62f8ccbe1d42263bb264fcf071c7f77649f0ee30

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
<<<<<<< HEAD
}

function load_mailbox(mailbox) {
  
=======


};

function load_mailbox(mailbox) {

>>>>>>> 62f8ccbe1d42263bb264fcf071c7f77649f0ee30
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

<<<<<<< HEAD
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}
=======
  // Clear previous content
  const view = document.querySelector('#emails-view');
  view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails for this mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      console.log(`Loaded ${mailbox}:`, emails); // ✅ View in console

      emails.forEach(email => {
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email-entry';
        emailDiv.style.border = '1px solid #ccc';
        emailDiv.style.padding = '10px';
        emailDiv.style.margin = '5px';
        emailDiv.style.backgroundColor = email.read ? '#f9f9f9' : 'white';

        const header = (mailbox === 'sent')
          ? `To: ${email.recipients.join(', ')}`
          : `From: ${email.sender}`;

        emailDiv.innerHTML = `
          <strong>${header}</strong>
          <span style="float: right;">${email.timestamp}</span><br>
          <em>${email.subject}</em>
        `;

        view.appendChild(emailDiv);
      });
    });
}
>>>>>>> 62f8ccbe1d42263bb264fcf071c7f77649f0ee30
