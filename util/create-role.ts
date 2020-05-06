import Engine from '@frogfish/kona'

const engine = Engine('debug', '../test/config.yaml').start();
engine.on('started', () => {
    const role = engine.module('role', engine.getSystemUser());
    role.create({
            name: 'Member',
            code: 'member',
            permissions: ['member']
        },
        (err, result) => {
            if (err) {
                return console.log(err);
            }

            console.log('Role created: ' + JSON.stringify(result));
        });
});
