# Beta 0.2 owner test workflow

Use disposable internal-test data only. Keep the browser console open and record the page, action, visible error, and request ID for every failure.

## 1. Aamish administrator

1. Sign in with the existing Super Admin account. Confirm the Overview initially tells the truth about available data.
2. Create one test enterprise with two delivery locations and its first administrator. Confirm the slug is generated and the credential handoff appears once.
3. Create one active menu package with a portrait or landscape image. Confirm the image remains contained in the library card.
4. Publish two service dates with at least two menu options.
5. Confirm Calendar and Fulfillment show the same enterprise, dates, locations, options, and counts.
6. Open Quality and Product feedback. Confirm unclassified product bugs are not labelled confirmed food incidents.

## 2. Enterprise administrator

1. Sign in using the administrator created above. Confirm Overview and Meals show only this enterprise.
2. On People, add one employee using a four-character-or-longer temporary password.
3. Import a CSV containing one valid row and one invalid location code. Confirm the valid row is created and the failed row number is reported.
4. Search/filter the roster. Confirm no unsupported edit or deactivate action is implied.
5. Confirm Reviews is initially empty or contains only this enterprise’s reviews.

## 3. Employee

1. Sign in as the individually created employee. Confirm Today displays the correct location, service, package image, selected option, and cutoff state.
2. Before cutoff, change the option, skip the meal, and reserve it again. Confirm each result beside the action.
3. Confirm Schedule shows the same upcoming dates and receiving/skipping state.
4. On or after the meal date, submit a rating, comment, and one supported image; submit again to confirm update behavior.
5. Sign in as Super Admin and Enterprise Admin and confirm the review appears only in the appropriate queues.

## 4. Isolation and responsive gate

1. Try each role’s copied URL while signed in as another role; confirm redirection to the correct portal.
2. Repeat the primary page of each role at a narrow mobile width. Check horizontal scrolling, clipped text, image stretching, dialogs, and fixed-navigation overlap.
3. Remove disposable employees, schedules, menus, feedback, and enterprise data when testing is complete.

Do not merge `dev` into `main` if authentication, enterprise isolation, cutoff enforcement, preference counts, review submission, media containment, or a required mobile action fails.
