# Fixes to be Ready for a First User

The following are the priority ordered required updates before we can have a user try the CRC-Hub:

## To-Do
- Fix add study / patient and list doesn't update bug. **Graham**
- Date Picker styling fixes **Graham**
- Fix bug with separator for some of the panels. It appears to the right of the true separation line **Graham / John**
- Finish Checklist display in Panel and printing as HTML: **Mike / John**
  - Add Schedule and Checklist details
  - Make links to systems be real html links
  - Make tasks be clickable checkboxes
- Handle errors for can't display chart with at least better error messages. **Mike**
- Add something on home page or remove it **Mike & Graham**
- Update what is displayed on Info / Help panel **John**
  - Write a simple user guide with focus on how to create a study design
- Find a way to make tabbing into a concept that is just a label select it and allow it to be deleted **Mike & Graham**
- Default to Study-Design tab when study is in planning status and to Patient tab when beyond planning? **Graham / John**
- Not needed for user but really need to know how well AI can generate a study DSL from a protocol document. Try with JSL protocol reader?


## In-Progress
- Fix bug that prevents patient-level charts. Currently the charts display with the legend and content missing not available and patient visit **Mike**
- Close panels when switching to a different study / patient or update them to match the changed context **John**
- Update deployment and re-deploy to Azure **Graham**

## Fixed
- Fix data saving and loading issues for study, patient, availability. Most of the existing studies in the data store are now empty folders. Need to determine what happened. Seems to have happened after my changes to saving a patient. **FIXED**
- Is there an issue where we leave deleted studies as folders? At least clean-up stored studies to be only ones that work. **Graham & Mike** **FIXED by new DB**
