import { ConsensusMeta } from '../../src';

export const headerA = {
  execution_optimistic: false,
  data: {
    root: '0xe38dd3eba0199ae8a22407a2c485fd00ce0c5522d8c7da0cc491caea732807f4',
    canonical: true,
    header: {
      message: {
        slot: '4774624',
        proposer_index: '130400',
        parent_root:
          '0x6998730c2a5fe8dc03e60e9ffff0f554d5f14d43384dfa9697107bb513765660',
        state_root:
          '0xb841bbb0ebc4b078d5efde852ff95c7253c2843e9f5364187aa14c782de13231',
        body_root:
          '0x2cb6e3df1fd314899a06822238939b0faca3c29659a50c9c8fddcdd71691356f',
      },
      signature:
        '0xb4d8b266a7c6bf3cc1efebe6fa85dea914428928e7414f29db6f17b71925a1bbb7213410160717d199b9c287aba64fe4102804f28bfa0c313b1dcf7e687dacde8e7fa70482d8e05f2d4f981bc71b52aff72ade601e107a0fd89db7a0dcbe3c06',
    },
  },
};

export const headerB = {
  execution_optimistic: false,
  data: {
    root: '0xa32a40484d36d9996d11e047c9bacb6b503c9e23fb0987d913078988c1dfde51',
    canonical: true,
    header: {
      message: {
        slot: '4774625',
        proposer_index: '6940',
        parent_root:
          '0xe38dd3eba0199ae8a22407a2c485fd00ce0c5522d8c7da0cc491caea732807f4',
        state_root:
          '0x549969c840ba969f57c37c57fd59f84852d5cda4eccbbe7b813db48309a96c44',
        body_root:
          '0x7020cad9a2a8508a6c4e756a334c0255fec2fc5fbc3c9c2c119898cf0a783e43',
      },
      signature:
        '0xb12ec96006c75ba382e596d4530bfbb3cf13cd6fc4f96fa27d1fce969102495044f19416c667fc67c47e560b1365f96c16c1d29e048af8e726e24338cb36d98cb9882798ae31675fa4b00e977c67b5483cb4ed81fc0f1c01c91bbf5fbc29e511',
    },
  },
};

export const headerD = {
  execution_optimistic: false,
  data: {
    root: '0xf2e504f4ee08a3ca60a937475a91b1bca3f98cad1be36c3ac87ad80a7a99cfe4',
    canonical: true,
    header: {
      message: {
        slot: '4774626',
        proposer_index: '146430',
        parent_root:
          '0xa32a40484d36d9996d11e047c9bacb6b503c9e23fb0987d913078988c1dfde51',
        state_root:
          '0x07b015be475bfb9e17a0203e8ec4c636a5d1fe1bab9c55c27193f8e6e67e76f5',
        body_root:
          '0x63127fc4bce13e075483eea0d65d3d76600d73b61f797b21eb6806a4d7fbb5fc',
      },
      signature:
        '0xaad550dfc343541c0281418f80f5bb9618d01116b4baecf1c04db3e05b881636ee2516fc35c2989bbbe183c6edb42ea316b833c9b67e8e8e10e4faa451d66c4bd63c544cf6fafed4cf8abf942025a8a5d92e4967ce4c2f40e0afbc5037898660',
    },
  },
};

export const headerC = {
  execution_optimistic: false,
  data: {
    root: '0x0ec77557c2da7a0e69bdbc579a62be483387346a3b7e15aa56603111b756698b',
    canonical: true,
    header: {
      message: {
        slot: '4774627',
        proposer_index: '348560',
        parent_root:
          '0xf2e504f4ee08a3ca60a937475a91b1bca3f98cad1be36c3ac87ad80a7a99cfe4',
        state_root:
          '0xbb40a7a0ee7b9438cdb441069fcbc644e567a71149b888e00b98c804527ee1ea',
        body_root:
          '0x561c8da70c56fa39cbe3aa9d856a9f3f8e294d5b837d09f5cef8f73a832c92aa',
      },
      signature:
        '0xa14fdabc8b2fac8921526dba123b1a04c667ca7e03acd9e47f8974408dbef630b167ee369819e001b0f93486c88906e8007d96e785eac09f5a25bafc049c695f4043520054258fea25d256fc9783c7e42b2d679bff35317d15a250141daee8f5',
    },
  },
};

export const slotA = headerA.data.header.message.slot;
export const slotB = headerB.data.header.message.slot;
export const slotC = headerC.data.header.message.slot; // no execution_payload in blockC
export const slotD = headerD.data.header.message.slot; // bad validators

export const headers = {
  [slotA]: headerA,
  [slotB]: headerB,
  ['finalized']: headerB,
  [slotC]: headerC, // no execution_payload in block
  [slotD]: headerD, // bad validators
};

export const blockA = {
  version: 'bellatrix',
  execution_optimistic: false,
  data: {
    message: {
      slot: '4774624',
      proposer_index: '130400',
      parent_root:
        '0x6998730c2a5fe8dc03e60e9ffff0f554d5f14d43384dfa9697107bb513765660',
      state_root:
        '0xb841bbb0ebc4b078d5efde852ff95c7253c2843e9f5364187aa14c782de13231',
      body: {
        randao_reveal:
          '0x979d121e562f2e5a91a8b4c3fa09c3100b082a846921504b2e161cb329789deb57e7064ed4c52c903ba08621a32c1e0303839b901fac75cef7ff5eaec5226f0c8d98c8de9fb3ee2860593dd9ea4e9b7171bd3d7cce9bb53891528c8abf84a293',
        eth1_data: {
          deposit_root:
            '0xd4e95fd34dec8960ce6973c762ebf1f80a6577310d98a8004307302f5f4dbf5e',
          deposit_count: '195216',
          block_hash:
            '0xf7a79965a9caf9a89d6b36a349ec599df48bb3d75dba6a51f8c7015fe1bab2c6',
        },
        graffiti:
          '0x74656b752f7632322e31322e302b3132372d6733616339323536000000000000',
        proposer_slashings: [],
        attester_slashings: [],
        attestations: [
          /* fake empty */
        ],
        deposits: [],
        voluntary_exits: [],
        sync_aggregate: {
          sync_committee_bits:
            '0xfcdfffdffdfdffbf3ff99fefe5fb95b3fffff7f71e77bf3ff7bf1fd8fdffbf7dffe7ffbfff9acef7ed9ffbbffbf7fdf7faf0bffedfedffbd3ffa3f947ffbd7ff',
          sync_committee_signature:
            '0xa7d49f496e1c8db9bd3292a55e1451175a3cd4adc6f1246b015427fcffbd4eecaf0eead1e96bfa7842bdf662e5082dc31099fedbb21f00f674e9beda8fa08d26826c28121b212a06f33d1d328faff8d95c068fad52078e0e858931205a9e45b9',
        },
        execution_payload: {
          parent_hash:
            '0x1447e721f3f56cc65899023f67876e86560bf172a3d9913b358f76a3bdd66f41',
          fee_recipient: '0x000095e79eac4d76aab57cb2c1f091d553b36ca0',
          state_root:
            '0xabc57973b76308d7843ab9dc29967a5c2308034ceb093a1fbc72a86522785da2',
          receipts_root:
            '0xd1dabf348b90517787732552669d290328a593a7e1bac5a5f648995498bc7fd3',
          logs_bloom:
            '0x040400f11440100000401040001118200200424000000812008b000018890513200000090200421010020030a800200080009424640281488822c2a4042004002240a20c847800c908400028090c90000002800802d2014102012000c002008000441010020210c00100069000000a140d000240206040200022081004080080288080040406680201081001a00801200820158428108000900120021c2000440a090400420002106000293400020040800104002004002020210088802029004922d00240048940142000000803240002210049020200020111090c09002062b09b8002000008300828006b00000027424800d000a84544004a000000801304',
          prev_randao:
            '0x2409abe67204d5fb2e241c134dd1488f87f2f0d6fb690b8efb6c8248c389f998',
          block_number: '8316773',
          gas_limit: '30000000',
          gas_used: '7972101',
          timestamp: '1673803488',
          extra_data: '0x',
          base_fee_per_gas: '3778',
          block_hash:
            '0x769ff0798b912b17b5b7ecb32c6110df055c85f2b3e6ae3260c93d7e15cfd2c3',
          transactions: [
            /* fake empty */
          ],
        },
      },
    },
    signature:
      '0xb4d8b266a7c6bf3cc1efebe6fa85dea914428928e7414f29db6f17b71925a1bbb7213410160717d199b9c287aba64fe4102804f28bfa0c313b1dcf7e687dacde8e7fa70482d8e05f2d4f981bc71b52aff72ade601e107a0fd89db7a0dcbe3c06',
  },
};

export const blockB = {
  version: 'bellatrix',
  execution_optimistic: false,
  data: {
    message: {
      slot: '4774625',
      proposer_index: '6940',
      parent_root:
        '0xe38dd3eba0199ae8a22407a2c485fd00ce0c5522d8c7da0cc491caea732807f4',
      state_root:
        '0x549969c840ba969f57c37c57fd59f84852d5cda4eccbbe7b813db48309a96c44',
      body: {
        randao_reveal:
          '0xb9aa020ea1f14ad7b84dda827c0a01d27f2e8c28a8f0b3513fa9350fdd05b42f44c112e4c7d8e6a5c0f317747943d33e0c5bb931f0fbde27724e3cf818a8a6cc59a656a82bbcbae13732db6afceabe3448834f765ebf9b2e31a20a954bb6858e',
        eth1_data: {
          deposit_root:
            '0xd4e95fd34dec8960ce6973c762ebf1f80a6577310d98a8004307302f5f4dbf5e',
          deposit_count: '195216',
          block_hash:
            '0xf7a79965a9caf9a89d6b36a349ec599df48bb3d75dba6a51f8c7015fe1bab2c6',
        },
        graffiti:
          '0x6c69676874686f7573652d676574680000000000000000000000000000000000',
        proposer_slashings: [],
        attester_slashings: [],
        attestations: [
          /* fake empty */
        ],
        deposits: [],
        voluntary_exits: [],
        sync_aggregate: {
          sync_committee_bits:
            '0xfcdfffdffdfdffbf3ff99fefe5fb95b3fffff7f71e77bf3ff7bf1fd8fdffbf7dffe7ffbfff9acef7ed9ffbbffbf7fdf7faf0bffedfedffbd3ffa3f947ffbd7ff',
          sync_committee_signature:
            '0xa9b50bf1b2710f7ace8dbca2ae6f1dd5b482b765c4311add343d3fb64896a067a804d8a5eff08815191ab71b8ffe1cc507ded45f03657ae5c861ef8d83b2934f158a07bc7daa6a72397be5056b29ccbb1eca41110e467ca8f4722c7afbea08a2',
        },
        execution_payload: {
          parent_hash:
            '0x769ff0798b912b17b5b7ecb32c6110df055c85f2b3e6ae3260c93d7e15cfd2c3',
          fee_recipient: '0x8dc847af872947ac18d5d63fa646eb65d4d99560',
          state_root:
            '0x3f39ddc6502c6577f10278b08c33cae3966ccaa26f66e965c3ae54cf5a704d68',
          receipts_root:
            '0x5a54a3f0c59b2450127e4efdf02a1fed151aa4ebca8a5d8d3665ee61c94e88ea',
          logs_bloom:
            '0x40a481c716212f54a03348008008806241a1396301801c5010a30300689b840c208e543c00a203af629c43da98e43a40412381fc0b192b6480955f1704a4304148610071b538508a18d0220c044811b20205a0a101d672c28851019ca1013949061070b0f348c005673254b85044881508022d018884f6c0b6e2401e14ab64e865a08c697480310c004a3407ad03403c22e90e09633a801d1c2110e338690a048acede58411dc510d09a2270a2538a431b1403004ca4d806a06000ed2d29e0908061c81a348ca4010082022447d007448244123c02b6e03145a34f771c05702094b39d6a7205e3232400048204d16c4e00c134dd1d1140c1280a00d910021a01',
          prev_randao:
            '0x9e599f9c924120b07bb1c9cd5b68a90f0c9b7cca140b1b429b806e8458f4c3cd',
          block_number: '8316774',
          gas_limit: '30000000',
          gas_used: '29956268',
          timestamp: '1673803500',
          extra_data: '0x506f776572656420627920626c6f58726f757465',
          base_fee_per_gas: '3557',
          block_hash:
            '0x752eac45878d63f2a1b80eebd6910d04b015cc643c8db894474169742fef788f',
          transactions: [
            /* fake empty */
          ],
        },
      },
    },
    signature:
      '0xb12ec96006c75ba382e596d4530bfbb3cf13cd6fc4f96fa27d1fce969102495044f19416c667fc67c47e560b1365f96c16c1d29e048af8e726e24338cb36d98cb9882798ae31675fa4b00e977c67b5483cb4ed81fc0f1c01c91bbf5fbc29e511',
  },
};

// no execution_payload
export const blockC = {
  version: 'bellatrix',
  execution_optimistic: false,
  data: {
    message: {
      slot: '4774627',
      proposer_index: '348560',
      parent_root:
        '0xf2e504f4ee08a3ca60a937475a91b1bca3f98cad1be36c3ac87ad80a7a99cfe4',
      state_root:
        '0xbb40a7a0ee7b9438cdb441069fcbc644e567a71149b888e00b98c804527ee1ea',
      body: {
        randao_reveal:
          '0x866044d1018f08cd616a7fc4b4661deb323f1c77a5f6ebc5ddf1052177bb18071d7bf429975552d6bf424c49d39881cb11e62aa85d3625cab66ac88af8a5eda16ca163289af24febe290148f0d3a35f40fec9aec700de2e2822a8e519cc8bd64',
        eth1_data: {
          deposit_root:
            '0xd4e95fd34dec8960ce6973c762ebf1f80a6577310d98a8004307302f5f4dbf5e',
          deposit_count: '195216',
          block_hash:
            '0xf7a79965a9caf9a89d6b36a349ec599df48bb3d75dba6a51f8c7015fe1bab2c6',
        },
        graffiti:
          '0x74656b752f7632322e31322e3000000000000000000000000000000000000000',
        proposer_slashings: [],
        attester_slashings: [],
        attestations: [
          /* fake empty */
        ],
        deposits: [],
        voluntary_exits: [],
        sync_aggregate: {
          sync_committee_bits:
            '0xfcdffbdffdfdffbf3ff99fef65e99533fffff7f71e77bf3ff7bf1fd8fdffbf7dffe7ffbfff9acef7ed9ffbbffbf7fdf7fae0bfdedfecef3d3ffa3f947ffbd7ff',
          sync_committee_signature:
            '0xab941a89f711e9ce484b82db13c4b58f1adc07b37b8488fdabcc18867ccaf294c93ff903e47c5727ecf767dd4d2895fa16592d54ca653e5d1f28df19553a2ea4510db2c077a0b1094bc4aca804052235edf0c75e5c519254045e15580cee1454',
        },
        // no execution payload
      },
    },
    signature:
      '0xa14fdabc8b2fac8921526dba123b1a04c667ca7e03acd9e47f8974408dbef630b167ee369819e001b0f93486c88906e8007d96e785eac09f5a25bafc049c695f4043520054258fea25d256fc9783c7e42b2d679bff35317d15a250141daee8f5',
  },
};

export const blockD = {
  version: 'bellatrix',
  execution_optimistic: false,
  data: {
    message: {
      slot: '4774626',
      proposer_index: '146430',
      parent_root:
        '0xa32a40484d36d9996d11e047c9bacb6b503c9e23fb0987d913078988c1dfde51',
      state_root:
        '0x07b015be475bfb9e17a0203e8ec4c636a5d1fe1bab9c55c27193f8e6e67e76f5',
      body: {
        randao_reveal:
          '0xaacb3e0be6de5b5183c06ce032c3fa60c836baa35e2a1afdd66caf131617cf0319e0c8d23c3832b9faed78089d27590f14960a38f01d72e61b522f544e24c3f26ac2908326e7267142768845b2265cd6dad7094d109bc505c2477385ba7086bf',
        eth1_data: {
          deposit_root:
            '0xd4e95fd34dec8960ce6973c762ebf1f80a6577310d98a8004307302f5f4dbf5e',
          deposit_count: '195216',
          block_hash:
            '0xf7a79965a9caf9a89d6b36a349ec599df48bb3d75dba6a51f8c7015fe1bab2c6',
        },
        graffiti:
          '0x74656b752f7632322e31322e302b3132372d6733616339323536000000000000',
        proposer_slashings: [],
        attester_slashings: [
          /* fake empty */
        ],
        attestations: [],
        deposits: [],
        voluntary_exits: [],
        sync_aggregate: {
          sync_committee_bits:
            '0x7cdfffdffdfdffbf3fb99fefe5fb95b3ffffe7f71e67bf3ff7bf1fd8fdffbf7dffe7ffbfff9acef7ed97fbbffbf7fd77faf0bffedfedffbd3ffa3f9477fbd7ff',
          sync_committee_signature:
            '0x941270951669d2307c919b557bed75a1f691157cfa92862a174e460c81a3433865dede20150e97183f563bb906819cea12660ef2850dcfa08f7b652f9c7287b43c4af675ffa7eabc01582b037f1b2e1fd892f088dfe5a1e74c21351876b4bfa9',
        },
        execution_payload: {
          parent_hash:
            '0x752eac45878d63f2a1b80eebd6910d04b015cc643c8db894474169742fef788f',
          fee_recipient: '0x8dc847af872947ac18d5d63fa646eb65d4d99560',
          state_root:
            '0x04039ee3bb548a399ace47f3630f58138b87c00587f1d3a488b0468e771c7c6a',
          receipts_root:
            '0x1984e4e7498f8636532425ad6f688595a584d625d3b3b1a04260c29f031ce640',
          logs_bloom:
            '0x40200292202e525e8259540882040a01000c6b6501080dd208884028ca028c1902264400926a8310122e0190a0c402d50042128841822f788a115e068224002028cc4061dc7108e87a033848184e31baa504a02402d516d00c41210cc404ac410924100486364280ce271280003688910ea0094020445f8020c7485980c800c8128540669562410820001803041163a020212e902d32844d10030142146641540a09d8014288033001c12c719a92aa410a0001023045a284b0900126a420280b886cd09310b0890b1414c0c118539e100c2014e4000e003413134896388061a0b43e19a00100c8222a004bca00110106804820fc090d60d181ca10c000813040',
          prev_randao:
            '0x164b0ce39286ecd6c5d4fe920b9112860cad1c718a00c2f2af6de71d4ac6832f',
          block_number: '8316775',
          gas_limit: '30000000',
          gas_used: '11915219',
          timestamp: '1673803512',
          extra_data: '0x506f776572656420627920626c6f58726f757465',
          base_fee_per_gas: '4000',
          block_hash:
            '0xd52be025e94ab5477a68ed178c03d3b8495d71b66d5c8ccc4bfc288620ef6394',
          transactions: [
            /* fake empty */
          ],
        },
      },
    },
    signature:
      '0xaad550dfc343541c0281418f80f5bb9618d01116b4baecf1c04db3e05b881636ee2516fc35c2989bbbe183c6edb42ea316b833c9b67e8e8e10e4faa451d66c4bd63c544cf6fafed4cf8abf942025a8a5d92e4967ce4c2f40e0afbc5037898660',
  },
};

export const blocks = {
  [headerA.data.root]: blockA,
  [headerB.data.root]: blockB,
  [headerC.data.root]: blockC,
  [headerD.data.root]: blockD,
};

export const consensusMetaA: ConsensusMeta = {
  epoch: Math.floor(Number(blockA.data.message.slot) / 32),
  slot: Number(blockA.data.message.slot),
  slotStateRoot: blockA.data.message.state_root,
  timestamp: Number(blockA.data.message.body.execution_payload.timestamp),
  blockNumber: Number(blockA.data.message.body.execution_payload.block_number),
  blockHash: blockA.data.message.body.execution_payload.block_hash,
};

export const consensusMetaB: ConsensusMeta = {
  epoch: Math.floor(Number(blockB.data.message.slot) / 32),
  slot: Number(blockB.data.message.slot),
  slotStateRoot: blockB.data.message.state_root,
  timestamp: Number(blockB.data.message.body.execution_payload.timestamp),
  blockNumber: Number(blockB.data.message.body.execution_payload.block_number),
  blockHash: blockB.data.message.body.execution_payload.block_hash,
};

export const stateValidatorsA = {
  execution_optimistic: false,
  data: [
    {
      index: '1',
      balance: '34006594880',
      status: 'active_ongoing',
      validator: {
        pubkey:
          '0xaffc434cf8138634a4cd0ef6cb815febd3db25760b1b6c522f9b4aa78e599b60336d7dd2e953192e45d4ac91f66f0723',
        withdrawal_credentials:
          '0x00fc40352b0a186d83267fc1342ec5da49dbb78e1099a4bd8db16d2c0d223594',
        effective_balance: '32000000000',
        slashed: false,
        activation_eligibility_epoch: '0',
        activation_epoch: '0',
        exit_epoch: '18446744073709551615',
        withdrawable_epoch: '18446744073709551615',
      },
    },
    {
      index: '2',
      balance: '34274744045',
      status: 'pending_queued',
      validator: {
        pubkey:
          '0xad9a0951d00c0988d3b8e719b9e65d6bc3501c9c35392fb6f050fcbbcdd316836a887acee989730bdf093629448bb731',
        withdrawal_credentials:
          '0x00472bc262a89d741a00806182cf90466d92ed498bb04d6a07620ebf798747db',
        effective_balance: '32000000000',
        slashed: false,
        activation_eligibility_epoch: '0',
        activation_epoch: '0',
        exit_epoch: '18446744073709551615',
        withdrawable_epoch: '18446744073709551615',
      },
    },
  ],
};

export const stateValidatorsB = {
  execution_optimistic: false,
  data: [
    {
      index: '1',
      balance: '34006594880',
      status: 'active_ongoing',
      validator: {
        pubkey:
          '0xaffc434cf8138634a4cd0ef6cb815febd3db25760b1b6c522f9b4aa78e599b60336d7dd2e953192e45d4ac91f66f0723',
        withdrawal_credentials:
          '0x00fc40352b0a186d83267fc1342ec5da49dbb78e1099a4bd8db16d2c0d223594',
        effective_balance: '32000000000',
        slashed: false,
        activation_eligibility_epoch: '0',
        activation_epoch: '0',
        exit_epoch: '18446744073709551615',
        withdrawable_epoch: '18446744073709551615',
      },
    },
    {
      index: '2',
      balance: '34274744045',
      status: 'active_ongoing', // changed from 'pending_queued'
      validator: {
        pubkey:
          '0xad9a0951d00c0988d3b8e719b9e65d6bc3501c9c35392fb6f050fcbbcdd316836a887acee989730bdf093629448bb731',
        withdrawal_credentials:
          '0x00472bc262a89d741a00806182cf90466d92ed498bb04d6a07620ebf798747db',
        effective_balance: '32000000000',
        slashed: false,
        activation_eligibility_epoch: '0',
        activation_epoch: '0',
        exit_epoch: '18446744073709551615',
        withdrawable_epoch: '18446744073709551615',
      },
    },
    {
      index: '3',
      balance: '34091066347',
      status: 'active_ongoing',
      validator: {
        pubkey:
          '0xb319a5f89662c127718c0be02599dfd28f4983590bdd30a6f04ea900847d91a5dedf6ed780defa926d1fc7ed07a1c47d',
        withdrawal_credentials:
          '0x00edb33e0856b163b1386ddd6fc0fb322e6e5a22cfd97eae71b4afbf70d39a94',
        effective_balance: '32000000000',
        slashed: false,
        activation_eligibility_epoch: '0',
        activation_epoch: '0',
        exit_epoch: '18446744073709551615',
        withdrawable_epoch: '18446744073709551615',
      },
    },
  ],
};

export const stateValidatorsD = undefined;

export const stateValidators = {
  [blockA.data.message.state_root]: stateValidatorsA,
  [blockB.data.message.state_root]: stateValidatorsB,
  [blockC.data.message.state_root]: [], // no execution_payload in block
  [blockD.data.message.state_root]: stateValidatorsD,
};
