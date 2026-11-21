# User Auth Specification

## Purpose

Account creation, sign-in, sign-out and role-based authorization for TwinES. Two roles exist: `owner` (manages own vehicles) and `technician` (looks up any vehicle and records serviced parts). Scenario IDs (`AUTH-xx`) are test case identifiers.

## Requirements

### Requirement: Owner sign-up

The system MUST let a visitor create an account with an email and a password. Accounts created through sign-up SHALL always have the `owner` role. The email MUST be a valid address, unique case-insensitively, and stored lowercase. The password MUST have at least 8 characters, including at least one letter and one digit. Passwords MUST be stored only as a salted hash, never in plain text.

#### Scenario: AUTH-01 Successful sign-up

- GIVEN no account exists for "ana@example.com"
- WHEN a visitor signs up with "Ana@Example.com" and password "secret123"
- THEN an account with role `owner` and email "ana@example.com" is created
- AND the visitor is signed in and redirected to their vehicle list

#### Scenario: AUTH-02 Duplicate email rejected

- GIVEN an account exists for "ana@example.com"
- WHEN a visitor signs up with "ANA@example.com"
- THEN the account is not created
- AND the form shows "An account with this email already exists"

#### Scenario: AUTH-03 Weak password rejected

- GIVEN the sign-up form
- WHEN a visitor submits the password "abcdefg" (7 characters, no digit)
- THEN the account is not created
- AND the form explains the password rule

#### Scenario: AUTH-04 Invalid email rejected

- GIVEN the sign-up form
- WHEN a visitor submits "ana@" as email
- THEN the account is not created
- AND the form shows an invalid email message

#### Scenario: AUTH-05 Password is never stored in plain text

- GIVEN a visitor signed up with password "secret123"
- WHEN the stored user record is inspected
- THEN the stored password value differs from "secret123" and is a salted hash

### Requirement: Technician accounts are not self-service

Technician accounts MUST NOT be creatable through public sign-up. They SHALL be provisioned by seed data or an administrative script.

#### Scenario: AUTH-06 Role cannot be injected at sign-up

- GIVEN the sign-up endpoint
- WHEN a request includes `role=technician`
- THEN the created account has role `owner`

### Requirement: Sign-in

The system MUST authenticate users by email (case-insensitive) and password and start a session stored in an httpOnly, SameSite cookie. Failed attempts MUST return the same generic message whether the email exists or not.

#### Scenario: AUTH-07 Successful sign-in

- GIVEN an owner account "ana@example.com" with password "secret123"
- WHEN the user signs in with those credentials
- THEN a session starts and the user lands on their vehicle list

#### Scenario: AUTH-08 Wrong password or unknown email

- GIVEN an owner account "ana@example.com"
- WHEN the user signs in with a wrong password, or with "nobody@example.com"
- THEN no session starts
- AND both cases show exactly "Invalid email or password"

#### Scenario: AUTH-09 Session cookie flags

- GIVEN a successful sign-in
- WHEN the response cookies are inspected
- THEN the session cookie is httpOnly and SameSite=Lax or stricter

### Requirement: Brute-force protection

The system MUST lock sign-in for an email for 15 minutes after 5 consecutive failed attempts. A successful sign-in SHALL reset the failure counter.

#### Scenario: AUTH-10 Lockout after repeated failures

- GIVEN 5 consecutive failed sign-in attempts for "ana@example.com"
- WHEN a 6th attempt is made with the correct password within 15 minutes
- THEN sign-in is refused with a "Too many attempts, try again later" message

#### Scenario: AUTH-11 Lockout expires

- GIVEN "ana@example.com" was locked 15 minutes ago
- WHEN the user signs in with the correct password
- THEN the sign-in succeeds and the failure counter resets

### Requirement: Sign-out

The system MUST end the session on sign-out so the session cookie can no longer access protected resources.

#### Scenario: AUTH-12 Sign-out invalidates the session

- GIVEN a signed-in user
- WHEN the user signs out and then requests the vehicle list with the old cookie
- THEN the request is treated as unauthenticated

### Requirement: Route protection and role authorization

All vehicle pages and endpoints MUST require an authenticated session. Unauthenticated page requests SHALL redirect to sign-in; unauthenticated API requests SHALL receive 401. Technician-only pages and actions MUST return 403 to owners.

#### Scenario: AUTH-13 Anonymous user is redirected

- GIVEN no session
- WHEN a visitor opens the vehicle list page
- THEN they are redirected to the sign-in page

#### Scenario: AUTH-14 Anonymous API call is rejected

- GIVEN no session
- WHEN a client calls a vehicle API endpoint
- THEN the response status is 401

#### Scenario: AUTH-15 Owner cannot use technician features

- GIVEN a signed-in owner
- WHEN the owner opens the technician vehicle search or calls "mark part serviced"
- THEN the response status is 403
