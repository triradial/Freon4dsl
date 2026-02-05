# CRC Plan 

The following are the roughly priority ordered required updates before we can have a user try the CRC-Hub:

Maintained in project GitHub repo at: [docs/CRC-Plan.md](./CRC-Plan.md)

## TBD
- [ ] I believe we discussed with Jos in the past that Freon would auto create the single concept when you hit the '+ concept'. It doesn't work. The the only choice for '+ SystemAccesses' is a SystemAccess concept. I see the drop down when I click it rather than it just being created. I added a discussion on it to Freon. Is this something we'll fix ourselves?


## Graham

### To-Do 
- [ ] Improve light-mode, e.g., add more contrast so things like patient date slider is visible. 
- [ ] Document and test the steps to bring on a user
- [ ] Create a repeatable demo script (whoever is done first will do this)
- [ ] Fix ReferenceComponent:
  - [ ] To display like SelectableListItemComponent
  - [ ] Fix Jump to reference button to work again
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
- [ ] Add patient page with visits / checklist, add note taking place
  - [ ] Add existing single patient full schedule chart to a draw / panel in the new UI

### Done
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
- [ ] Add back pdf/print behavior to checklist (discuss with Graham, e.g., where does button go)
- [ ] Create complex and realistic examples of checklists
- [ ] Rebuild some or all of the studies to test behavior and useability
- [ ] Make tasks be clickable checkboxes
- [ ] Setup tests of incomplete studies and add additional validation checks if/as needed so reliably get charts, etc.
- [ ] Determine whether optional from Freon is needed and where 
- [ ] Remove choice of the visit you are on when 'start when' is a reference. Needs custom scope added. 
- [ ] Not needed for first user but really need to know how well AI can generate a study DSL from a protocol document. Try with JSL protocol reader?

### In-Progress
- [ ] Test, update, and add buttons for things like duplicate and smart duplicate


### Done
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
- [ ] Add single event patient checklist to be displayed from the patient page and selected date. Use latest version of template somehow merged with template the Jon created.
- [ ] Add choice of template studies when creating a study

### To-Do 
- [ ]

### In-Progress
- [ ] Add multi-patient full schedule chart as an alternative view
- [ ] add back view of availability to chart

### Done
- [x] Copy a study feature
- [x] Review new UI implementation done by Graham...
