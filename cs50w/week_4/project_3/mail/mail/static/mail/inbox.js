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
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(`HTTP ${response.status}: ${err.error || 'Unknown error'}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        // Clear out composition fields
        document.querySelector('#compose-recipients').value = '';
        document.querySelector('#compose-subject').value = '';
        document.querySelector('#compose-body').value = '';
        // After sending, load the sent mailbox to see your sent email
        load_mailbox('sent');
      })
      .catch(error => {
        console.error('Error sending email:', error);
        alert('Error sending email: ' + error.message);
      });
  }

  // By default, load the inbox
  load_mailbox('inbox');
});


// Compose email
//show the compose view
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}



// Load the mailbox
//show the emails in the inbox
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#sent-detail-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      return response.json();
    })
    .then(emails => {
      console.log('Emails received:', emails);
      console.log('Number of emails:', emails.length);

      document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

      //show the emails in the inbox
      emails.forEach(email => {
        const emailElement = document.createElement('div');
        emailElement.classList.add('email');

        // Determine button text and action based on current mailbox
        const isArchived = mailbox === 'archive';
        const buttonText = isArchived ? 'Unarchive' : 'Archive';
        const buttonAction = isArchived ? 'unarchive' : 'archive';

        emailElement.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
            <p style="margin: 0; font-weight: bold; font-size: 1.2em;">From: ${email.sender}</p>
            <h4 style="margin: 0; flex-grow: 1; text-align: left; ">${email.subject}</h4>
            <span style="font-size: 0.8em; color: #666; white-space: nowrap;">${email.timestamp}</span>
            <button class="btn btn-sm btn-outline-primary archive-btn" data-action="${buttonAction}" data-email-id="${email.id}">${buttonText}</button>
          </div>
        `;

        // Add click listener to view email details (but not when clicking archive button)
        emailElement.addEventListener('click', (e) => {
          if (!e.target.classList.contains('archive-btn')) {
            view_email(email.id);
          }
        });

        // Add click listener for archive/unarchive button
        const archiveBtn = emailElement.querySelector('.archive-btn');
        archiveBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent email view from opening
          const action = e.target.dataset.action;
          const emailId = e.target.dataset.emailId;

          if (action === 'archive') {
            archive_email(emailId);
          } else {
            unarchive_email(emailId);
          }
        });

        document.querySelector('#emails-view').appendChild(emailElement);
      });
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}


// View email details when user clicks on an email
function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block';
  document.querySelector('#sent-detail-view').style.display = 'none';

  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      // DEBUG: Log the full email object to see what we're working with
      console.log('Full email object:', email);

      // Determine button text and action based on email's archived status
      const isArchived = email.archived;
      const buttonText = isArchived ? 'Unarchive' : 'Archive';
      const buttonAction = isArchived ? 'unarchive' : 'archive';

      // DEBUG: Log the button configuration
      console.log('Email ID:', email.id);
      console.log('Email archived status:', isArchived);
      console.log('Button text will be:', buttonText);
      console.log('Button action will be:', buttonAction);

      document.querySelector('#email-detail-view').innerHTML = `
      <button class="btn btn-sm btn-outline-primary" id="back-to-inbox">← Back to Inbox</button>
      <div class="email-detail">
        <h2>${email.subject}</h2>
        <button class="btn btn-sm btn-outline-primary archive-btn" data-action="${buttonAction}" data-email-id="${email.id}">${buttonText}</button>
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

      // Add click listener for archive/unarchive button
      const archiveBtn = document.querySelector('.archive-btn');
      if (archiveBtn) {
        archiveBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent any other events
          const action = e.target.dataset.action;
          const emailId = e.target.dataset.emailId;

          if (action === 'archive') {
            archive_email(emailId);
          } else {
            unarchive_email(emailId);
          }
        });
      }
    });
}


// to archive an email
function archive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      archived: true
    })
  })
    .then(response => {
      if (response.ok) {
        console.log('Email archived successfully');
        load_mailbox('inbox');
      } else {
        console.error('Failed to archive email:', response.status);
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}


// to unarchive an email
function unarchive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      archived: false
    })
  })
    .then(response => {
      if (response.ok) {
        console.log('Email unarchived successfully');
        load_mailbox('inbox');
      } else {
        console.error('Failed to unarchive email:', response.status);
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
}


