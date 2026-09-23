-- 1. Rename the Nous AI lesson ID for consistency with the l-arduino-N pattern.
UPDATE lessons SET id = 'l-nous-ai-1' WHERE id = 'l-nousai-1';

-- 2. Lesson plans for Arduino Uno Q lectures 2-14.
--    (Two of the links you sent pointed to the same document — that one
--    is used for lesson 2, and the remaining 12 unique docs cover 3-14.)

UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1vqFHHPYUsC_OOXvMpqufEeL3fmvYrFWj/export?format=docx' WHERE id = 'l-arduino-2';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1y0iLvR9ee6Os31FhUdm3UdgehLwG6AS6/export?format=docx' WHERE id = 'l-arduino-3';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/17C1ghVbEE2y5TDZmGWdNt9fsfiYu_P9j/export?format=docx' WHERE id = 'l-arduino-4';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1TJYcHuIL4Kc-cMDauGpMfJuj2VHHhexu/export?format=docx' WHERE id = 'l-arduino-5';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1DBYjmW9yf7v1gzkYYsMCzPj5mcz0zWWq/export?format=docx' WHERE id = 'l-arduino-6';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1ozzVsUY2iBoUVvP9vum7AEcKSoX00e1D/export?format=docx' WHERE id = 'l-arduino-7';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1nHVRBKU8VGvjjU7cLGJLbmMfgIIPsmvF/export?format=docx' WHERE id = 'l-arduino-8';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1vgIwR6DoL4FW1ynlsUisaVdSc6-1_7wo/export?format=docx' WHERE id = 'l-arduino-9';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1fqRyZSkovVFLyB34SGv2iocyn3RsVHiA/export?format=docx' WHERE id = 'l-arduino-10';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1K1r9PSdmG7bGM60WWoa4MRmo6x8GZPle/export?format=docx' WHERE id = 'l-arduino-11';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1GBjpzWs4YgCkNam021FKL46xfRA0Q1tl/export?format=docx' WHERE id = 'l-arduino-12';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1l5vgGk2KACmp-WpDzR60MJINRUo1SPbY/export?format=docx' WHERE id = 'l-arduino-13';
UPDATE lessons SET lesson_plan_url = 'https://docs.google.com/document/d/1IqLlckOsrorjhRXnfvBfVdpsJgELkink/export?format=docx' WHERE id = 'l-arduino-14';
