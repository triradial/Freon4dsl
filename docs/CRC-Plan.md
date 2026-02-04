# CRC Plan 

The following are the roughly priority ordered required updates before we can have a user try the CRC-Hub:

Maintained in project GitHub repo at: [docs/CRC-Plan.md](./CRC-Plan.md)

## Graham

### To-Do 
- [ ] Update what is displayed on Info / Help panel
  - [ ] Write/generate a simple user guide with focus on how to create a study design
- [ ] Make staff shared/optionally-shared across studies (not essential for first user)
- [ ] Make roles shared/optionally-shared across studies (not essential for first user)
- [ ] Document and test the steps to bring on a user
- [ ] Create a repeatable demo script (whoever is done first will do this)
- Not needed for first user:
  - [ ] Setup approach to testing new charts and other parts of the UI
  - [ ] Add tests

### In-Progress
- [ ] Deploy to Azure
- [ ] Create a dev/test instance on Azure
- [ ] Add patient page with visits / checklist, add note taking place
  - [ ] Add existing single patient full schedule chart to a draw / panel in the new UI
- [ ] HTML editor:
  - [ ] return and tab need to not jump out of editor

### Done
- [x] Show Patients page when no patients to allow getting started on study
- [x] Make error messages jump to concept with error; also improved the message with context
- [x] Get undo-redo working again
- [x] Delete study from study page behavior
- [x] Error locator working (unless the content is hidden), with improved message
- [x] Custom action selector only shows a single outline with there are multiple in the hierarchy

## Mike

### To-Do 
- [ ] Model unscheduled and other special events in the language in a better way. 
- [ ] Determine whether optional from Freon is needed and where 
- [ ] Make sure data entry of shared-tasks, shared-steps still work. Make sure they display in checklist like a non shared task 
- [ ] Repeating Visits with occurrence on the schedule 
- [ ] Test, update, and add buttons for things like duplicate and smart duplicate
- [ ] Remove choice of the visit you are on when 'start when' is a reference. Needs custom scope added. 
- [ ] Not needed for first user but really need to know how well AI can generate a study DSL from a protocol document. Try with JSL protocol reader?

### In-Progress
- [ ] Improve validation error messages
- [ ] Update to current Freon version.
- [ ] Finish Checklist display and printing as HTML: 
  - [x] Add Schedule and Checklist details
  - [x] Make links to systems be real html links
  - [x] Improve formatting overall
  - [ ] Add unscheduled event support to checklist
  - [ ] Make tasks be clickable checkboxes


### Done
- [x] Get rid of the 'Notes' stuff, have only description and explore always having descriptions displayed. 
- [x] Review single event patient checklist that Jon created to determine if Graham can use it. -> It should be useable after the rest of the checklist display is cleaned-up 
- [x] make default study have 'day 0' as start when to avoid the error.


## Jon
- [ ] Add single event patient checklist to be displayed from the patient page and selected date. Use latest version of template somehow merged with template the Jon created.

### To-Do 
- [ ]

### In-Progress
- [ ] Add multi-patient full schedule chart

### Done
- [x] Copy a study feature
- [x] Review new UI implementation done by Graham...
