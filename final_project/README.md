# PRAYER TIME
#### Video Demo:  <[URL HERE](https://youtu.be/8OnSkaiaKSw)>
#### Description:
In my "Prayer Time" project, I developed a platform that provides users with access to prayer times and the ability to read the Quran. In the app.py file, I created two routes: one for the home page and another for the Quran section. On the home page, users can search for their location to view corresponding prayer times and also find a clock displaying the current time.

To bring this functionality to life, I created two essential files: index.html and index.js. In the index.html file, I wrote the code for the prayer table, which includes a table displaying the prayer times for Fajr, Zuhr, Asr, Maghrib, and Isha. The times are hardcoded but could be dynamically updated based on the form input. There's a real-time clock that shows the current time, updating every second to help users keep track of time easily. Additionally, the app includes a simple form where users can enter their city and state. Once submitted, the app fetches the prayer times and displays them in a clean, organized table.

In the index.js file, I crafted the necessary functions using JavaScript for seamless operability:

1. Dynamic Prayer Times: Users can input their city and state, and the application fetches the prayer times for Fajr, Zuhr, Asr, Maghrib, and Isha from an external API. The times are then displayed in a user-friendly format.
2. Real-Time Clock: The application includes a real-time clock that updates every second, helping users keep track of the current time.
3. User-Friendly Form: There’s a simple form where users can enter their city and state. Upon submission, the form fetches the prayer times and updates the display accordingly.
4. Error Handling: The application includes error handling to manage issues with fetching data, such as network errors or incorrect input. Users are alerted if there’s a problem retrieving the prayer times.
5. Responsive Design: The layout is designed to be responsive, ensuring it looks good on both desktop and mobile devices.
6. JavaScript Integration: The app uses JavaScript to handle form submissions, fetch prayer times, and update the display. It also includes a function to convert 24-hour time to 12-hour format for easier reading.

For the Quran section, I designed two essential files: quran.html and quran.js. Within the quran.html file, I included the page title and connected it to the JavaScript file, quran.js, where I implemented the functionality using the alquran API to retrieve all the surahs. The application dynamically loads and displays a list of Surahs, allowing users to easily browse and select the Surah they want to read. Furthermore, I added meticulous code for the translation of the verses into Arabic and English.

In my layout.html file, I utilized Bootstrap for styling, ensuring a modern and responsive design. This makes the app look good on both desktop and mobile devices. I assigned specific classes and IDs to ensure a perfectly formatted display. The header includes a navigation bar with links to the Home and Quran pages. The navbar is collapsible, making it user-friendly on smaller screens. The template includes links to external JavaScript and CSS files, ensuring that the app is styled and functions correctly.
