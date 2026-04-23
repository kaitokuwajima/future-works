var CALENDAR_ID = 'primary';
var SLOTS = [
  '6:00-6:30',
  '6:30-7:00',
  '12:30-13:00',
  '13:00-13:30',
  '18:00-18:30'
];
var LOOKAHEAD_DAYS = 14;
var FALLBACK_CHOICE = '上記以外をご希望の方は'
  + '、お電話（080-4343-2366）または'
  + 'メール（kaito.k0626@gmail.com）'
  + 'にてご連絡ください';
var YOUBI = ['日','月','火','水','木','金','土'];

function isAllDay(event) {
  return event.isAllDayEvent();
}

function updateSlots() {
  var form = FormApp.getActiveForm();
  var items = form.getItems(
    FormApp.ItemType.LIST
  );
  if (items.length === 0) {
    Logger.log('リスト項目が見つかりません');
    return;
  }
  var listItem = items[0].asListItem();
  var cal = CalendarApp.getCalendarById(
    CALENDAR_ID
  );
  var choices = [];
  var now = new Date();
  for (var d = 0; d < LOOKAHEAD_DAYS; d++) {
    var date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + d
    );
    var y = date.getFullYear();
    var mo = date.getMonth() + 1;
    var da = date.getDate();
    var w = YOUBI[date.getDay()];
    for (var s = 0; s < SLOTS.length; s++) {
      var parts = SLOTS[s].split('-');
      var sp = parts[0].split(':');
      var ep = parts[1].split(':');
      var start = new Date(date);
      start.setHours(
        parseInt(sp[0]),
        parseInt(sp[1]), 0, 0
      );
      var end = new Date(date);
      end.setHours(
        parseInt(ep[0]),
        parseInt(ep[1]), 0, 0
      );
      if (start < now) continue;
      var ev = cal.getEvents(start, end);
      var busy = false;
      for (var e = 0; e < ev.length; e++) {
        if (!ev[e].isAllDayEvent()) {
          busy = true;
          break;
        }
      }
      if (!busy) {
        var label = y + '年'
          + mo + '月'
          + da + '日'
          + ' ' + sp[0] + '時'
          + sp[1] + '分'
          + ' (' + w + ')';
        choices.push(label);
      }
    }
  }
  choices.push(FALLBACK_CHOICE);
  listItem.setChoiceValues(choices);
  Logger.log(
    'スロット更新完了: '
    + choices.length + '件'
  );
}

function onFormSubmit(e) {
  var res = e.response.getItemResponses();
  var name = '';
  var email = '';
  var slot = '';
  var msg = '';
  for (var i = 0; i < res.length; i++) {
    var t = res[i].getItem().getTitle();
    var a = res[i].getResponse();
    if (t.indexOf('名前') !== -1) {
      name = a;
    } else if (t.indexOf('メール') !== -1) {
      email = a;
    } else if (t.indexOf('希望') !== -1 ||
               t.indexOf('日時') !== -1 ||
               t.indexOf('予約') !== -1) {
      slot = a;
    } else if (t.indexOf('内容') !== -1 ||
               t.indexOf('相談') !== -1) {
      msg = a;
    }
  }
  if (!slot || slot === FALLBACK_CHOICE) {
    Logger.log('スロット未選択: ' + name);
    return;
  }
  var m = slot.match(
    /(\d{4})年(\d{1,2})月(\d{1,2})日\s+(\d{1,2})時(\d{2})分/
  );
  if (!m) {
    Logger.log('日時パース失敗: ' + slot);
    return;
  }
  var si = SLOTS.length - 1;
  for (var i = 0; i < SLOTS.length; i++) {
    var sp = SLOTS[i].split('-')[0].split(':');
    if (parseInt(sp[0]) === parseInt(m[4])
      && parseInt(sp[1]) === parseInt(m[5])) {
      si = i;
      break;
    }
  }
  var ep = SLOTS[si].split('-')[1].split(':');
  var start = new Date(
    parseInt(m[1]),
    parseInt(m[2]) - 1,
    parseInt(m[3]),
    parseInt(m[4]),
    parseInt(m[5]), 0
  );
  var end = new Date(
    parseInt(m[1]),
    parseInt(m[2]) - 1,
    parseInt(m[3]),
    parseInt(ep[0]),
    parseInt(ep[1]), 0
  );
  var cal = CalendarApp.getCalendarById(
    CALENDAR_ID
  );
  var existing = cal.getEvents(start, end);
  var busy = false;
  for (var j = 0; j < existing.length; j++) {
    if (!existing[j].isAllDayEvent()) {
      busy = true;
      break;
    }
  }
  if (busy) {
    Logger.log('ダブルブッキング: ' + slot);
    if (email) {
      MailApp.sendEmail({
        to: email,
        subject: '【FRENVOX】予約日時が埋まりました',
        body: name + ' 様\n\n'
          + 'お申し込みの日時（' + slot
          + '）は埋まってしまいました。\n\n'
          + '改めてフォームよりお選びください。'
          + '\n\nFRENVOX 桑島'
      });
    }
    updateSlots();
    return;
  }
  cal.createEvent(
    '【無料相談】' + name + ' 様',
    start,
    end,
    {
      description: 'メール: ' + email
        + '\n内容: ' + msg
    }
  );
  if (email) {
    MailApp.sendEmail({
      to: email,
      subject: '【FRENVOX】ご予約を承りました',
      body: name + ' 様\n\n'
        + 'ご予約ありがとうございます。\n'
        + '以下の日時で確定しました。\n\n'
        + '日時: ' + slot + '\n\n'
        + 'オンライン（Google Meet）です。\n'
        + '当日のURLは前日にお送りします。\n\n'
        + 'FRENVOX 桑島\n'
        + 'kaito.k0626@gmail.com\n'
        + '080-4343-2366'
    });
  }
  updateSlots();
  Logger.log('予約確定: ' + name);
}

function setupTriggers() {
  var trgs = ScriptApp.getProjectTriggers();
  for (var i = 0; i < trgs.length; i++) {
    ScriptApp.deleteTrigger(trgs[i]);
  }
  ScriptApp.newTrigger('updateSlots')
    .timeBased()
    .everyHours(1)
    .create();
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(FormApp.getActiveForm())
    .onFormSubmit()
    .create();
  Logger.log('トリガー設定完了');
}

function setupForm() {
  var form = FormApp.getActiveForm();
  form.setTitle(
    'FRENVOX 無料AI相談 予約フォーム'
  );
  form.setDescription(
    '以下のフォームにご記入ください。'
    + '\nご予約確定後、確認メールをお送りします。'
  );
  form.addTextItem()
    .setTitle('お名前')
    .setRequired(true);
  form.addTextItem()
    .setTitle('メールアドレス')
    .setRequired(true);
  form.addTextItem()
    .setTitle('お電話番号')
    .setRequired(false);
  form.addListItem()
    .setTitle('ご希望の日時')
    .setChoiceValues(['読み込み中'])
    .setRequired(true);
  form.addParagraphTextItem()
    .setTitle('ご相談内容')
    .setRequired(false);
  Logger.log('フォーム作成完了');
}
