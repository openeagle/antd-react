import jss from 'js-serialization';

import moment, { Moment } from 'moment';

const serializer = jss.create();

serializer.register({
  reviver(key, value, raw, parsed) {
    if (parsed?.type === 'moment') {
      return moment(Number(parsed.value));
    }
    return value;
  },
  replacer(key, value, raw) {
    if (raw instanceof moment) {
      return jss.toDataURL(
        'moment',
        String((raw as Moment).toDate().getTime())
      );
    }
    return value;
  },
});

export default serializer;
