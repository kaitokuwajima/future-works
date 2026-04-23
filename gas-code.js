var CALENDAR_ID = 'primary';
var SLOTS = ['6:00-6:30', '6:30-7:00', '12:30-13:00', '13:00-13:30', '18:00-18:30'];
var LOOKAHEAD_DAYS = 14;
var FALLBACK_CHOICE = '上記以外をご希望の方は、お電話（080-4343-2366）またはメール（kaito.k0626@gmail.com）にてご連絡ください';

function updateSlots() {
  var form = FormApp.getActiveForm();
  var items = form.getItems(FormApp.ItemType.LIST);
  if (items.length === 0) {
    Logger.log('リスト項目が見つかりません');
    return;
  }
  var listItem = items[0].asListItem();
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  var choices = [];
  var now = new Date();
  for (var d = 0; d < LOOKAHEAD_DAYS; d++) {
    var date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    var dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd (EEE)');
    for (var s = 0; s < SLOTS.length; s++) {
      var parts = SLOTS[s].split('-');
      var startParts = parts[0].split(':');
      var endParts = parts[1].split(':');
      var start = new Date(date);
      start.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);
      var end = new Date(date);
      end.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
      if (start < now) continue;
      var events = cal.getEvents(start, end);
      if (events.length === 0) {
        choices.push(dateStr + ' ' + SLOTS[s]);
      }
    }
  }
  choices.push(FALLBACK_CHOICE);
  listItem.setChoiceValues(choices);
  Logger.log('スロット更新完了: ' + choices.length + '件');
}

function onFormSubmit(e) {
  var responses = e.response.getItemResponses();
  var name = '';
  var email = '';
  var selectedSlot = '';
  var message = '';
  for (var i = 0; i < responses.length; i++) {
    var title = responses[i].getItem().getTitle();
    var answer = responses[i].getResponse();
    if (title.indexOf('名前') !== -1 || title.indexOf('お名前') !== -1) {
      name = answer;
    } else if (title.indexOf('メール') !== -1 || title.indexOf('Email') !== -1) {
      email = answer;
    } else if (title.indexOf('希望') !== -1 || title.indexOf('日時') !== -1 || title.indexOf('予約') !== -1) {
      selectedSlot = answer;
    } else if (title.indexOf('内容') !== -1 || title.indexOf('相談') !== -1 || title.indexOf('メッセージ') !== -1) {
      message = answer;
    }
  }
  if (!selectedSlot || selectedSlot === FALLBACK_CHOICE) {
    Logger.log('スロット未選択またはフォールバック選択: ' + name);
    return;
  }
  var match = selectedSlot.match(/(\d{4})\/(\d{2})\/(\d{2}).+?(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
  if (!match) {
    Logger.log('日時パース失敗: ' + selectedSlot);
    return;
  }
  var start = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), 0);
  var end = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[6]), parseInt(match[7]), 0);
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  var existing = cal.getEvents(start, end);
  if (existing.length > 0) {
    Logger.log('ダブルブッキング防止: ' + selectedSlot);
    if (email) {
      MailApp.sendEmail({
        to: email,
        subject: '【FRENVOX】ご予約の日時が埋まってしまいました',
        body: name + ' 様\n\nお申し込みいただいた日時（' + selectedSlot + '）は、直前に他のご予約が入ってしまいました。\n\n大変恐れ入りますが、改めてフォームよりご希望の日時をお選びください。\n\nFRENVOX 桑島'
      });
    }
    updateSlots();
    return;
  }
  cal.createEvent('【無料相談】' + name + ' 様', start, end, {description: 'メール: ' + email + '\n内容: ' + message});
  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: '【FRENVOX】ご予約を承りました',
      body: name + ' 様\n\nご予約ありがとうございます。\n以下の日時でご予約を確定いたしました。\n\n日時: ' + selectedSlot + '\n\nオンライン（Google Meet）でのご相談となります。\n当日のURLは前日までにメールにてお送りいたします。\n\nご不明点がございましたら、お気軽にご連絡ください。\n\nFRENVOX 桑島\nメール: kaito.k0626@gmail.com\n電話: 080-4343-2366'
    });
  }
  updateSlots();
  Logger.log('予約確定: ' + name + ' / ' + selectedSlot);
}

function setupTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('updateSlots').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('onFormSubmit').forForm(FormApp.getActiveForm()).onFormSubmit().create();
  Logger.log('トリガー設定完了');
}
