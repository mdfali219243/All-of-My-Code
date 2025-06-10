-- Keep a log of any SQL queries you execute as you solve the mystery.

-- I use this queries to know what is happening or to know the information
SELECT description FROM crime_scene_reports WHERE day = 28 AND month = 7 AND street = 'Humphrey Street';

-- I tried to get information about thef by looking at the withness
SELECT name, transcript FROM interviews WHERE day = 28 AND month = 7 AND year = 2023 AND transcript  LIKE '%bakery%';


-- I write this code to see who help the theft to get out of the location
SELECT bakery_security_logs.minute, bakery_security_logs.activity, bakery_security_logs.license_plate, people.name
FROM people
JOIN bakery_security_logs ON people.license_plate = bakery_security_logs.license_plate
WHERE
    bakery_security_logs.day = 28
    AND bakery_security_logs.month = 7
    AND bakery_security_logs.year = 2023
    AND bakery_security_logs.hour  =  10
    AND bakery_security_logs.minute >= 15
    AND bakery_security_logs.minute <= 25;


-- we could know the of thef information by atm transactipn
-- we wanna know the name of the theft and try to check if neme of theft is in bakery_security_log
SELECT people.name, atm_transactions.transaction_type, people.license_plate From people
JOIN bank_accounts ON bank_accounts.person_id = people.id
JOIN atm_transactions ON atm_transactions.account_number = bank_accounts.account_number
WHERE atm_transactions.year = 2023
AND atm_transactions.month = 7
AND atm_transactions.day = 28
AND atm_transactions.atm_location = 'Leggett Street'
AND atm_transactions.transaction_type = 'withdraw';


-- We wanna know about what 3rd withness said
--we will see who the theft was taking to and we wanna get information about theft flight ticket
SELECT caller, receiver, caller_name, receiver_name
FROM phone_calls
WHERE day = 28
AND month = 7
AND year = 2023
AND duration < 60;

UPDATE phone_calls
SET caller_name = people.name
FROM people
WHERE phone_calls.caller = people.phone_number;
UPDATE phone_calls

SET receiver_name = people.name
FROM people
WHERE phone_calls.receiver = people.phone_number;


--we wanna know about where the theft going and from where
SELECT f.id, f.hour, f.minute, a1.city AS origin_city, a2.city AS destination_city
FROM flights f
JOIN airports a1 ON f.origin_airport_id = a1.id
JOIN airports a2 ON f.destination_airport_id = a2.id
WHERE f.day = 29 AND f.month = 7 AND f.year = 2023
ORDER BY f.hour ASC
LIMIT 1;

--we wanna know the name of theft
--we wanna wanna know the phone number and license_plate of theft so we can match with others

SELECT name, a2.city AS destination_city, phone_number, license_plate
FROM people
JOIN passengers ON people.passport_number = passengers.passport_number
JOIN flights ON flights.id = passengers.flight_id
JOIN airports a2 ON flights.destination_airport_id = a2.id
WHERE
flights.id = 36
ORDER BY flights.hour ASC;


