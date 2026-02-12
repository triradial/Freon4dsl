# CRC Plan 

The following are the roughly priority ordered required updates before we can have a user try the CRC-Hub:

Maintained in project GitHub repo at: [docs/CRC-Plan.md](./CRC-Plan.md)

## TBD
- [ ] Review the way CSS was added inline for the checklist HTML page and decide if it needs to be integrated with the light/dark CSS for the app.


## Graham

### To-Do 
- [ ] Chart on patient page sometimes doesn't render, e.g., first patient for Arcadia study only shows first month or two.
- [ ] Create a database backup / snapshot and restore process that we can use to reset after demos. We'll need a standard set of studies setup and the process should allow us to take a new snapshot to use going forward or to have multiple snapshots for different kinds of demos. 
- [ ] Review and clean-up Mike's hack at checklists on the patient page. 
- [ ] Review and revise Home page as needed to take better advantage of all the new features. 
- Not needed for first user:
  - [ ] Add a way to search the content of the study design better than just cntl-f in the browser?
  - [ ] Make staff shared/optionally-shared across studies (not essential for first user)
  - [ ] Make roles shared/optionally-shared across studies (not essential for first user)
  - [ ] Update what is displayed on Info / Help panel
  - [ ] Write/generate a simple user guide with focus on how to create a study design
  - [ ] Setup approach to testing new charts and other parts of the UI
  - [ ] Add tests

### In-Progress
- [ ] Deploy to Azure
- [ ] Create a dev/test instance on Azure
- [ ] Document and test the steps to bring on a user
- [ ] Improve light-mode, e.g., add more contrast so things like patient date slider is visible. 

### Done
- [x] Add patient page with visits / checklist
  - [x] Add existing single patient full schedule chart to a draw / panel in the new UI
- [x] HTML editor: return and tab need to not jump out of editor
- [x] Improve validation error messages
- [x] Show Patients page when no patients to allow getting started on study
- [x] Make error messages jump to concept with error; also improved the message with context
- [x] Get undo-redo working again
- [x] Delete study from study page behavior
- [x] Error locator working (unless the content is hidden), with improved message
- [x] Custom action selector only shows a single outline with there are multiple in the hierarchy
- [x] '+' should expand if collapsed
- [x] change the 'Errors' tab to something friendlier, e.g., 'Issues', 'To-Do', 'Incomplete'
- [x] Investigate how Freon shows error under field to see if we can use it, e.g., box added errors for the item group name


## Mike

### To-Do 
- [ ] Create a repeatable demo script (whoever is done first will do this)
- [ ] In patient chart:
  - [ ] If a visit/event and a window overlap how should it be shown, e.g., two icons in same box. Same question for visit/window overlapping patient unavailable. In some places you should two icons but not for all cases. 
- [ ] Is it a freon problem that when Add an Event and it does not show in the drop-down for the 'When'. Close and re-open the study and it shows. 
- [ ] Show/Hide for Unscheduled Events
- [ ] review and update tests
- [ ] Setup tests of incomplete studies and add additional validation checks if/as needed so reliably get charts, etc.
- [ ] Not needed for first user but really need to know how well AI can generate a study DSL from a protocol document. Try with JSL protocol reader?


### In-Progress
- [ ] Move to separate CRC project. 
- [ ] Rebuild some or all of the studies to test behavior and useability including creating realistic examples of checklists. 


### Done
- [x] The position of the phases in the timeline chart causes it to be clipped at the bottom. It wasn't originally like this so I'm guessing some of our application styling has drifted into the chart. Maybe pass this off to Jon?
- [x] Remove choice of the visit you are on when 'start when' is a reference. Needs custom scope added. 
- [x] Determine whether optional from Freon is needed and where: Does not seem to be needed in current UI
- [x] Make tasks be clickable checkboxes in a Word document
- [x] fix checklist hide/show for unscheduled event at study level
- [x] Fix ReferenceComponent:
  - [x] To display like SelectableListItemComponent
  - [x] Fix Jump to reference button to work again
- [x] Add back pdf/print behavior to checklist
- [x] - Get control-x, control-c, control-v working
- [x] Test, update, and add buttons for things like duplicate and smart duplicate, 
- [x] Make sure data entry of shared-tasks, shared-steps still work. Make sure they display in checklist like a non shared task 
- [x] Unscheduled and other special events
  - [x] Model unscheduled and other special events in the language in a better way.
  - [x] Add unscheduled event support to checklist
- [x] remove duplicate first scheduled choices 
- [x] Repeating Visits with occurrence on the schedule 
- [x] Finish Checklist display and printing as HTML: 
  - [x] Add Schedule and Checklist details
  - [x] Make links to systems be real html links
  - [x] Improve formatting overall
- [x] Update to current Freon version.
- [x] Get rid of the 'Notes' stuff, have only description and explore always having descriptions displayed. 
- [x] Review single event patient checklist that Jon created to determine if Graham can use it. -> It should be useable after the rest of the checklist display is cleaned-up 
- [x] make default study have 'day 0' as start when to avoid the error.


## Jon

### To-Do 
- [ ] Add toolbar to all the tabs, except Errors. Add legend icon for all charts, e.g., study-level chart needs legend and for it to be removed from the chart area.
- [ ] Add a way to take notes to the patient page 
- [ ] Add template management subsystem

### In-Progress
- [ ] Add choice of template studies when creating a study
- [ ] Add multi-patient full schedule chart as an alternative view
- [ ] add back view of availability to chart

### Done
- [x] Copy a study feature
- [x] Review new UI implementation done by Graham...



## Other Old Notes:

- [ ] Ignore not-available-dates before first visit
- [ ] Demo:
  - [ ] CRA Visit as a kind of event
  - [ ] Add a payment milestone to study and charts somehow
- [ ] Need a better way to allow something at study-start with a displacement time that doesn’t require to know what the ‘<choose>’ does and still reads well when you’ve added a displacement.  Does the trigger of = "plus or minus day/week/month/..." accomplish - [x] this?
- [ ] eventState of a EventReference is required. Either find a way to show it as an error or auto create it as ‘completed’
- [ ] Clean up wording of Repeats. Make ‘max’ be either ‘max’ or ‘exactly’ or some other way of expressing it.
- [ ] Change wording of window so at-most reads better and it’s clear it’s an outer vs. the inner window. Get words from graham, e.g., compliant. Maybe have a way to hide the outer window.
- [ ] Consider a +/- time so only need one number to enter
- [ ] Mixing up ‘completed’ vs. ‘each completed’ is a good demo scenario.
- [ ] Default Name of Period should not be ‘Period’. Maybe ‘Unnamed’ so clear that it isn’t named and easy to delete the word.
- [ ] Try CRC on phone
- [ ] Should we record who saw patient
- [ ] Delete key in a number field deletes the concept instead of the digit unless you double click mouse to select the thing to be deleted Appears to be fixed
- [ ] Use the brackets view to show parens for an expression to highlight how the tree is interpreted. Related is the optional projection option in an editor: https://www.freon4dsl.dev/030_Developing_a_Language/020_Definition_Level/010_Editor_Definition/020_Projections see Optional Projections examples:
  [?Helper functions:
            ${helpers vertical}]

