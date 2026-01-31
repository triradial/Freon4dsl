# CRC Plan 

The following are the roughly priority ordered required updates before we can have a user try the CRC-Hub:

Maintained in project GitHub repo at: [docs/CRC-Plan.md](./CRC-Plan.md)

## Graham

### To-Do 
- Get undo-redo working again
- Add patient page with visits / checklist, add note taking place
  - Add existing single patient full schedule chart to a draw / panel in the new UI
- HTML editor:
  - return and tab need to not jump out of editor
- Add single event patient checklist to be displayed from the patient page and selected date. See if the template the Jon created can be used for this checklist.
- Copy a study feature -> Jon
- Update what is displayed on Info / Help panel
  - Write/generate a simple user guide with focus on how to create a study design
- Deploy to Azure
- Create a dev/test instance on Azure
- Document and test the steps to bring on a user
- Create a repeatable demo script (whoever is done first will do this)

### In-Progress


### Done
- Show Patients page when no patients to allow getting started on study
- Make error messages jump to concept with error; also improved the message with context


## Mike

### To-Do 
- Make default study have a start event
- Finish Checklist display and printing as HTML: 
  - Add unscheduled event support to checklist (mike)
  - Add Schedule and Checklist details
  - Make links to systems be real html links
  - Make tasks be clickable checkboxes
  - Improve formatting overall
- Model unscheduled and other special events in the language in a better way. 
- Update to current Freon version. We need to discuss how to approach this. 
- Improve validation error messages (mike)
- Determine whether optional from Freon is needed and where 
- Make sure data entry of shared-tasks, shared-steps still work. Make sure they display in checklist like a non shared task 
- Repeating Visits with occurrence on the schedule 
- Remove choice of the visit you are on when 'start when' is a reference. Needs custom scope added. 
- make default study have 'day 0' as start when to avoid the error.
- Not needed for user but really need to know how well AI can generate a study DSL from a protocol document. Try with JSL protocol reader?

### In-Progress
- 

### Done
- Get rid of the 'Notes' stuff, have only description and explore always having descriptions displayed. 
- Review single event patient checklist that Jon created to determine if Graham can use it. -> It should be useable after the rest of the checklist display is cleaned-up 


## Jon

### To-Do 
- Add multi-patient full schedule chart


### In-Progress
- Review new UI implementation done by Graham...

### Done
- 
