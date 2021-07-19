(module
  (type (;0;) (func (param i32)))
  (type (;1;) (func (param i32) (result i32)))
  (type (;2;) (func (result i32)))
  (type (;3;) (func))
  (import "env" "memory" (memory (;0;) 120 120 shared))
  (func (;0;) (type 0) (param i32)
    (local i32 f32)
    block  ;; label = @1
      i32.const 0
      i32.load offset=4
      i32.const 64
      i32.sub
      local.tee 1
      local.get 0
      i32.store offset=60
      local.get 1
      local.get 0
      i32.load
      i32.store offset=56
      local.get 1
      local.get 1
      i32.load offset=60
      i32.load offset=4
      i32.store offset=52
      local.get 1
      local.get 1
      i32.load offset=60
      i32.load offset=8
      i32.store offset=48
      local.get 1
      local.get 1
      i32.load offset=60
      i32.load offset=12
      i32.store offset=44
      local.get 1
      local.get 1
      i32.load offset=60
      i32.load offset=16
      i32.store offset=40
      local.get 1
      local.get 1
      i32.load offset=60
      f32.load offset=32
      f32.store offset=36
      local.get 1
      local.get 1
      i32.load offset=60
      i32.load offset=20
      i32.store offset=32
      local.get 1
      local.get 1
      i32.load offset=60
      i32.load offset=24
      i32.store offset=28
      local.get 1
      local.get 1
      i32.load offset=60
      i32.load offset=28
      i32.store offset=24
      local.get 1
      local.get 1
      i32.load offset=60
      i32.load offset=60
      i32.store offset=20
      block  ;; label = @2
        loop  ;; label = @3
          local.get 1
          local.get 1
          i32.load offset=52
          local.tee 0
          i32.const -1
          i32.add
          i32.store offset=52
          local.get 0
          i32.const 1
          i32.lt_s
          br_if 1 (;@2;)
          local.get 1
          local.get 1
          i32.load offset=48
          local.get 1
          i32.load offset=32
          i32.shr_u
          local.get 1
          i32.load offset=24
          i32.and
          local.tee 0
          i32.store offset=16
          local.get 1
          local.get 0
          i32.const 1
          i32.add
          local.get 1
          i32.load offset=24
          i32.and
          i32.store offset=12
          local.get 1
          local.get 1
          f32.load offset=36
          local.get 1
          i32.load offset=48
          local.get 1
          i32.load offset=28
          i32.and
          f32.convert_i32_u
          f32.mul
          local.tee 2
          f32.store offset=8
          local.get 1
          f32.const 0x1p+0 (;=1;)
          local.get 2
          f32.sub
          local.tee 2
          f32.store offset=4
          local.get 1
          local.get 1
          i32.load offset=20
          local.tee 0
          local.get 1
          i32.load offset=16
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 2
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=12
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=8
          f32.mul
          f32.add
          f32.store
          local.get 1
          local.get 1
          i32.load offset=48
          local.get 1
          i32.load offset=44
          i32.add
          i32.store offset=48
          local.get 1
          local.get 1
          i32.load offset=44
          local.get 1
          i32.load offset=40
          i32.add
          i32.store offset=44
          local.get 1
          f32.load
          local.set 2
          local.get 1
          local.get 1
          i32.load offset=56
          local.tee 0
          i32.const 4
          i32.add
          i32.store offset=56
          local.get 0
          local.get 2
          f32.store
          br 0 (;@3;)
        end
        unreachable
      end
      local.get 1
      i32.load offset=60
      local.tee 0
      local.get 1
      i32.load offset=48
      i32.store offset=8
      local.get 0
      local.get 1
      i32.load offset=44
      i32.store offset=12
    end)
  (func (;1;) (type 0) (param i32)
    (local i32 f32 f32)
    block  ;; label = @1
      i32.const 0
      i32.load offset=4
      i32.const 80
      i32.sub
      local.tee 1
      local.get 0
      i32.store offset=76
      local.get 1
      local.get 0
      i32.load
      i32.store offset=72
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=4
      i32.store offset=68
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=8
      i32.store offset=64
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=12
      i32.store offset=60
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=16
      i32.store offset=56
      local.get 1
      local.get 1
      i32.load offset=76
      f32.load offset=32
      f32.store offset=52
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=20
      i32.store offset=48
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=24
      i32.store offset=44
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=28
      i32.store offset=40
      local.get 1
      local.get 1
      i32.load offset=76
      f32.load offset=36
      f32.store offset=36
      local.get 1
      local.get 1
      i32.load offset=76
      f32.load offset=40
      f32.store offset=32
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=60
      i32.store offset=28
      local.get 1
      local.get 1
      i32.load offset=76
      i32.load offset=64
      i32.store offset=24
      block  ;; label = @2
        loop  ;; label = @3
          local.get 1
          local.get 1
          i32.load offset=68
          local.tee 0
          i32.const -1
          i32.add
          i32.store offset=68
          local.get 0
          i32.const 1
          i32.lt_s
          br_if 1 (;@2;)
          local.get 1
          local.get 1
          i32.load offset=64
          local.get 1
          i32.load offset=48
          i32.shr_u
          local.get 1
          i32.load offset=40
          i32.and
          local.tee 0
          i32.store offset=20
          local.get 1
          local.get 0
          i32.const 1
          i32.add
          local.get 1
          i32.load offset=40
          i32.and
          i32.store offset=16
          local.get 1
          local.get 1
          f32.load offset=52
          local.get 1
          i32.load offset=64
          local.get 1
          i32.load offset=44
          i32.and
          f32.convert_i32_u
          f32.mul
          local.tee 3
          f32.store offset=12
          local.get 1
          f32.const 0x1p+0 (;=1;)
          local.get 3
          f32.sub
          local.tee 3
          f32.store offset=8
          local.get 1
          local.get 1
          i32.load offset=28
          local.tee 0
          local.get 1
          i32.load offset=20
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 3
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=16
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=12
          f32.mul
          f32.add
          f32.store offset=4
          local.get 1
          local.get 1
          i32.load offset=24
          local.tee 0
          local.get 1
          i32.load offset=20
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=8
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=16
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=12
          f32.mul
          f32.add
          local.tee 3
          f32.store
          local.get 1
          local.get 1
          f32.load offset=4
          local.tee 2
          local.get 3
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store offset=4
          local.get 1
          local.get 1
          f32.load offset=36
          local.get 1
          f32.load offset=32
          f32.add
          local.tee 3
          f32.store offset=36
          block  ;; label = @4
            block  ;; label = @5
              local.get 3
              f32.const 0x0p+0 (;=0;)
              f32.lt
              br_if 0 (;@5;)
              local.get 1
              f32.load offset=36
              local.tee 3
              f32.const 0x1p+0 (;=1;)
              f32.le
              local.get 3
              local.get 3
              f32.ne
              i32.or
              br_if 1 (;@4;)
            end
            local.get 1
            i32.const 0
            i32.store offset=32
          end
          local.get 1
          local.get 1
          i32.load offset=64
          local.get 1
          i32.load offset=60
          i32.add
          i32.store offset=64
          local.get 1
          local.get 1
          i32.load offset=60
          local.get 1
          i32.load offset=56
          i32.add
          i32.store offset=60
          block  ;; label = @4
            local.get 1
            f32.load offset=36
            local.tee 3
            f32.const 0x0p+0 (;=0;)
            f32.ge
            local.get 3
            local.get 3
            f32.ne
            i32.or
            br_if 0 (;@4;)
            local.get 1
            i32.const 0
            i32.store offset=36
            local.get 1
            i32.const 0
            i32.store offset=32
          end
          local.get 1
          i32.load offset=72
          local.tee 0
          local.get 1
          f32.load offset=4
          f32.store
          local.get 1
          local.get 0
          i32.const 4
          i32.add
          i32.store offset=72
          br 0 (;@3;)
        end
        unreachable
      end
      local.get 1
      i32.load offset=76
      local.tee 0
      local.get 1
      f32.load offset=36
      f32.store offset=36
      local.get 0
      local.get 1
      i32.load offset=64
      i32.store offset=8
      local.get 0
      local.get 1
      i32.load offset=60
      i32.store offset=12
    end)
  (func (;2;) (type 0) (param i32)
    (local i32 f32 f32)
    block  ;; label = @1
      i32.const 0
      i32.load offset=4
      i32.const 112
      i32.sub
      local.tee 1
      local.get 0
      i32.store offset=108
      local.get 1
      local.get 0
      i32.load
      i32.store offset=104
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=4
      i32.store offset=100
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=8
      i32.store offset=96
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=12
      i32.store offset=92
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=16
      i32.store offset=88
      local.get 1
      local.get 1
      i32.load offset=108
      f32.load offset=32
      f32.store offset=84
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=20
      i32.store offset=80
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=24
      i32.store offset=76
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=28
      i32.store offset=72
      local.get 1
      local.get 1
      i32.load offset=108
      f32.load offset=36
      f32.store offset=68
      local.get 1
      local.get 1
      i32.load offset=108
      f32.load offset=40
      f32.store offset=64
      local.get 1
      local.get 1
      i32.load offset=108
      f32.load offset=44
      f32.store offset=60
      local.get 1
      local.get 1
      i32.load offset=108
      f32.load offset=48
      f32.store offset=56
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=60
      i32.store offset=52
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=64
      i32.store offset=48
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=68
      i32.store offset=44
      local.get 1
      local.get 1
      i32.load offset=108
      i32.load offset=72
      i32.store offset=40
      block  ;; label = @2
        loop  ;; label = @3
          local.get 1
          local.get 1
          i32.load offset=100
          local.tee 0
          i32.const -1
          i32.add
          i32.store offset=100
          local.get 0
          i32.const 1
          i32.lt_s
          br_if 1 (;@2;)
          local.get 1
          local.get 1
          i32.load offset=96
          local.get 1
          i32.load offset=80
          i32.shr_u
          local.get 1
          i32.load offset=72
          i32.and
          local.tee 0
          i32.store offset=36
          local.get 1
          local.get 0
          i32.const 1
          i32.add
          local.get 1
          i32.load offset=72
          i32.and
          i32.store offset=32
          local.get 1
          local.get 1
          f32.load offset=84
          local.get 1
          i32.load offset=96
          local.get 1
          i32.load offset=76
          i32.and
          f32.convert_i32_u
          f32.mul
          local.tee 2
          f32.store offset=28
          local.get 1
          f32.const 0x1p+0 (;=1;)
          local.get 2
          f32.sub
          local.tee 2
          f32.store offset=24
          local.get 1
          local.get 1
          i32.load offset=52
          local.tee 0
          local.get 1
          i32.load offset=36
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 2
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=32
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=28
          f32.mul
          f32.add
          f32.store offset=20
          local.get 1
          local.get 1
          i32.load offset=48
          local.tee 0
          local.get 1
          i32.load offset=36
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=24
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=32
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=28
          f32.mul
          f32.add
          f32.store offset=16
          local.get 1
          local.get 1
          i32.load offset=44
          local.tee 0
          local.get 1
          i32.load offset=36
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=24
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=32
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=28
          f32.mul
          f32.add
          f32.store offset=12
          local.get 1
          local.get 1
          i32.load offset=40
          local.tee 0
          local.get 1
          i32.load offset=36
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=24
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=32
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=28
          f32.mul
          f32.add
          f32.store offset=8
          local.get 1
          local.get 1
          f32.load offset=20
          local.tee 2
          local.get 1
          f32.load offset=12
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=60
          f32.mul
          f32.add
          f32.store offset=20
          local.get 1
          local.get 1
          f32.load offset=16
          local.tee 2
          local.get 1
          f32.load offset=8
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=60
          f32.mul
          f32.add
          local.tee 2
          f32.store offset=16
          local.get 1
          local.get 1
          f32.load offset=20
          local.tee 3
          local.get 2
          local.get 3
          f32.sub
          local.get 1
          f32.load offset=68
          f32.mul
          f32.add
          f32.store offset=20
          local.get 1
          local.get 1
          f32.load offset=60
          local.get 1
          f32.load offset=56
          f32.add
          f32.store offset=60
          local.get 1
          local.get 1
          f32.load offset=68
          local.get 1
          f32.load offset=64
          f32.add
          f32.store offset=68
          local.get 1
          local.get 1
          i32.load offset=96
          local.get 1
          i32.load offset=92
          i32.add
          i32.store offset=96
          local.get 1
          local.get 1
          i32.load offset=92
          local.get 1
          i32.load offset=88
          i32.add
          i32.store offset=92
          local.get 1
          f32.load offset=20
          local.set 2
          local.get 1
          local.get 1
          i32.load offset=104
          local.tee 0
          i32.const 4
          i32.add
          i32.store offset=104
          local.get 0
          local.get 2
          f32.store
          br 0 (;@3;)
        end
        unreachable
      end
      local.get 1
      i32.load offset=108
      local.tee 0
      local.get 1
      f32.load offset=68
      f32.store offset=36
      local.get 0
      local.get 1
      f32.load offset=60
      f32.store offset=44
      local.get 0
      local.get 1
      i32.load offset=92
      i32.store offset=12
      local.get 0
      local.get 1
      i32.load offset=96
      i32.store offset=8
    end)
  (func (;3;) (type 0) (param i32)
    (local i32 f32 f32)
    block  ;; label = @1
      i32.const 0
      i32.const 0
      i32.load offset=4
      i32.const 144
      i32.sub
      local.tee 1
      i32.store offset=4
      local.get 1
      local.get 0
      i32.store offset=140
      local.get 1
      local.get 0
      i32.load
      i32.store offset=136
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=4
      i32.store offset=132
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=8
      i32.store offset=128
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=12
      i32.store offset=124
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=16
      i32.store offset=120
      local.get 1
      local.get 1
      i32.load offset=140
      f32.load offset=32
      f32.store offset=116
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=20
      i32.store offset=112
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=24
      i32.store offset=108
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=28
      i32.store offset=104
      local.get 1
      local.get 1
      i32.load offset=140
      f32.load offset=36
      f32.store offset=100
      local.get 1
      local.get 1
      i32.load offset=140
      f32.load offset=40
      f32.store offset=96
      local.get 1
      local.get 1
      i32.load offset=140
      f32.load offset=44
      f32.store offset=92
      local.get 1
      local.get 1
      i32.load offset=140
      f32.load offset=48
      f32.store offset=88
      local.get 1
      local.get 1
      i32.load offset=140
      f32.load offset=52
      f32.store offset=84
      local.get 1
      local.get 1
      i32.load offset=140
      f32.load offset=56
      f32.store offset=80
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=60
      i32.store offset=76
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=64
      i32.store offset=72
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=68
      i32.store offset=68
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=72
      i32.store offset=64
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=76
      i32.store offset=60
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=80
      i32.store offset=56
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=84
      i32.store offset=52
      local.get 1
      local.get 1
      i32.load offset=140
      i32.load offset=88
      i32.store offset=48
      block  ;; label = @2
        loop  ;; label = @3
          local.get 1
          local.get 1
          i32.load offset=132
          local.tee 0
          i32.const -1
          i32.add
          i32.store offset=132
          local.get 0
          i32.const 1
          i32.lt_s
          br_if 1 (;@2;)
          local.get 1
          local.get 1
          i32.load offset=128
          local.get 1
          i32.load offset=112
          i32.shr_u
          local.get 1
          i32.load offset=104
          i32.and
          local.tee 0
          i32.store offset=44
          local.get 1
          local.get 0
          i32.const 1
          i32.add
          local.get 1
          i32.load offset=104
          i32.and
          i32.store offset=40
          local.get 1
          local.get 1
          f32.load offset=116
          local.get 1
          i32.load offset=128
          local.get 1
          i32.load offset=108
          i32.and
          f32.convert_i32_u
          f32.mul
          local.tee 2
          f32.store offset=36
          local.get 1
          f32.const 0x1p+0 (;=1;)
          local.get 2
          f32.sub
          local.tee 2
          f32.store offset=32
          local.get 1
          local.get 1
          i32.load offset=76
          local.tee 0
          local.get 1
          i32.load offset=44
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 2
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=40
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store offset=28
          local.get 1
          local.get 1
          i32.load offset=72
          local.tee 0
          local.get 1
          i32.load offset=44
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=32
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=40
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store offset=24
          local.get 1
          local.get 1
          i32.load offset=68
          local.tee 0
          local.get 1
          i32.load offset=44
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=32
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=40
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store offset=20
          local.get 1
          local.get 1
          i32.load offset=64
          local.tee 0
          local.get 1
          i32.load offset=44
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=32
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=40
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store offset=16
          local.get 1
          local.get 1
          i32.load offset=60
          local.tee 0
          local.get 1
          i32.load offset=44
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=32
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=40
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store offset=12
          local.get 1
          local.get 1
          i32.load offset=56
          local.tee 0
          local.get 1
          i32.load offset=44
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=32
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=40
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store offset=8
          local.get 1
          local.get 1
          i32.load offset=52
          local.tee 0
          local.get 1
          i32.load offset=44
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=32
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=40
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store offset=4
          local.get 1
          local.get 1
          i32.load offset=48
          local.tee 0
          local.get 1
          i32.load offset=44
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=32
          f32.mul
          local.get 0
          local.get 1
          i32.load offset=40
          i32.const 2
          i32.shl
          i32.add
          f32.load
          local.get 1
          f32.load offset=36
          f32.mul
          f32.add
          f32.store
          local.get 1
          local.get 1
          f32.load offset=28
          local.tee 2
          local.get 1
          f32.load offset=12
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=84
          f32.mul
          f32.add
          f32.store offset=28
          local.get 1
          local.get 1
          f32.load offset=24
          local.tee 2
          local.get 1
          f32.load offset=8
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=84
          f32.mul
          f32.add
          f32.store offset=24
          local.get 1
          local.get 1
          f32.load offset=20
          local.tee 2
          local.get 1
          f32.load offset=4
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=84
          f32.mul
          f32.add
          f32.store offset=20
          local.get 1
          local.get 1
          f32.load offset=16
          local.tee 2
          local.get 1
          f32.load
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=84
          f32.mul
          f32.add
          f32.store offset=16
          local.get 1
          local.get 1
          f32.load offset=28
          local.tee 2
          local.get 1
          f32.load offset=20
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=92
          f32.mul
          f32.add
          f32.store offset=28
          local.get 1
          local.get 1
          f32.load offset=24
          local.tee 2
          local.get 1
          f32.load offset=16
          local.get 2
          f32.sub
          local.get 1
          f32.load offset=92
          f32.mul
          f32.add
          local.tee 2
          f32.store offset=24
          local.get 1
          local.get 1
          f32.load offset=28
          local.tee 3
          local.get 2
          local.get 3
          f32.sub
          local.get 1
          f32.load offset=100
          f32.mul
          f32.add
          f32.store offset=28
          local.get 1
          local.get 1
          f32.load offset=84
          local.get 1
          f32.load offset=80
          f32.add
          f32.store offset=84
          local.get 1
          local.get 1
          f32.load offset=92
          local.get 1
          f32.load offset=88
          f32.add
          f32.store offset=92
          local.get 1
          local.get 1
          f32.load offset=100
          local.get 1
          f32.load offset=96
          f32.add
          f32.store offset=100
          local.get 1
          local.get 1
          i32.load offset=128
          local.get 1
          i32.load offset=124
          i32.add
          i32.store offset=128
          local.get 1
          local.get 1
          i32.load offset=124
          local.get 1
          i32.load offset=120
          i32.add
          i32.store offset=124
          local.get 1
          f32.load offset=28
          local.set 2
          local.get 1
          local.get 1
          i32.load offset=136
          local.tee 0
          i32.const 4
          i32.add
          i32.store offset=136
          local.get 0
          local.get 2
          f32.store
          br 0 (;@3;)
        end
        unreachable
      end
      local.get 1
      i32.load offset=140
      local.tee 0
      local.get 1
      f32.load offset=100
      f32.store offset=36
      local.get 0
      local.get 1
      f32.load offset=92
      f32.store offset=44
      local.get 0
      local.get 1
      i32.load offset=128
      i32.store offset=8
      local.get 0
      local.get 1
      i32.load offset=124
      i32.store offset=12
      local.get 0
      local.get 1
      f32.load offset=84
      f32.store offset=52
      i32.const 0
      local.get 1
      i32.const 144
      i32.add
      i32.store offset=4
    end)
  (func (;4;) (type 1) (param i32) (result i32)
    block (result i32)  ;; label = @1
      i32.const 0
      i32.load offset=4
      i32.const 16
      i32.sub
      local.get 0
      i32.store offset=12
      local.get 0
      i32.const 14
      i32.shl
      i32.const 16
      i32.add
    end)
  (func (;5;) (type 2) (result i32)
    (local i32 i32 i32)
    block (result i32)  ;; label = @1
      i32.const 0
      i32.load offset=4
      i32.const 16
      i32.sub
      local.tee 2
      i32.const 0
      i32.store offset=12
      block  ;; label = @2
        loop  ;; label = @3
          local.get 2
          i32.load offset=12
          i32.const 4095
          i32.gt_s
          br_if 1 (;@2;)
          local.get 2
          i32.load offset=12
          local.tee 0
          i32.const 2
          i32.shl
          i32.const 1646624
          i32.add
          local.get 0
          i32.const 3
          i32.shl
          i32.const 1638432
          i32.add
          f64.load
          f32.demote_f64
          f32.store
          local.get 2
          local.get 0
          i32.const 1
          i32.add
          i32.store offset=12
          br 0 (;@3;)
        end
        unreachable
      end
      local.get 2
      i32.const 0
      i32.store offset=8
      block  ;; label = @2
        loop  ;; label = @3
          local.get 2
          i32.load offset=8
          i32.const 1023
          i32.gt_s
          br_if 1 (;@2;)
          local.get 2
          i32.load offset=8
          local.tee 1
          i32.const 2
          i32.shl
          local.tee 0
          i32.const 1663008
          i32.add
          i32.const 1056964608
          i32.store
          local.get 0
          i32.const 1667104
          i32.add
          i32.const -1090519040
          i32.store
          local.get 0
          i32.const 1675296
          i32.add
          i32.const -1090519040
          i32.store
          local.get 2
          local.get 1
          i32.const 1
          i32.add
          i32.store offset=8
          br 0 (;@3;)
        end
        unreachable
      end
      local.get 2
      i32.const 0
      i32.store offset=4
      block  ;; label = @2
        loop  ;; label = @3
          local.get 2
          i32.load offset=4
          i32.const 15
          i32.gt_s
          br_if 1 (;@2;)
          local.get 2
          i32.load offset=4
          local.tee 1
          i32.const 92
          i32.mul
          local.tee 0
          i32.const 1687584
          i32.add
          local.get 1
          i32.const 16
          i32.shl
          i32.const 1679392
          i32.add
          i32.store
          local.get 0
          i32.const 1687588
          i32.add
          i32.const 128
          i32.store
          local.get 0
          i32.const 1687592
          i32.add
          i32.const 0
          i32.store
          local.get 0
          i32.const 1687596
          i32.add
          i32.const 0
          i32.store
          local.get 0
          i32.const 1687600
          i32.add
          i32.const 0
          i32.store
          local.get 0
          i32.const 1687604
          i32.add
          i32.const 20
          i32.store
          local.get 0
          i32.const 1687608
          i32.add
          i32.const 1048575
          i32.store
          local.get 0
          i32.const 1687612
          i32.add
          i32.const 4095
          i32.store
          local.get 0
          i32.const 1687616
          i32.add
          i32.const 897581056
          i32.store
          local.get 0
          i32.const 1687620
          i32.add
          i32.const 0
          i32.store
          local.get 0
          i32.const 1687624
          i32.add
          i32.const 0
          i32.store
          local.get 0
          i32.const 1687628
          i32.add
          i32.const 1056964608
          i32.store
          local.get 0
          i32.const 1687644
          i32.add
          i32.const 1663008
          i32.store
          local.get 0
          i32.const 1687648
          i32.add
          i32.const 1646624
          i32.store
          local.get 0
          i32.const 1687652
          i32.add
          i32.const 1689056
          i32.store
          local.get 0
          i32.const 1687656
          i32.add
          i32.const 1663008
          i32.store
          local.get 0
          i32.const 1687660
          i32.add
          i32.const 1646624
          i32.store
          local.get 2
          i32.load offset=4
          i32.const 92
          i32.mul
          i32.const 1687664
          i32.add
          i32.const 1663008
          i32.store
          local.get 2
          i32.load offset=4
          i32.const 92
          i32.mul
          i32.const 1687668
          i32.add
          i32.const 1646624
          i32.store
          local.get 2
          i32.load offset=4
          i32.const 92
          i32.mul
          i32.const 1687672
          i32.add
          i32.const 1663008
          i32.store
          local.get 2
          local.get 2
          i32.load offset=4
          i32.const 1
          i32.add
          i32.store offset=4
          br 0 (;@3;)
        end
        unreachable
      end
      i32.const 1687584
    end)
  (func (;6;) (type 3)
    (local i32 i32 f32)
    block  ;; label = @1
      i32.const 0
      i32.const 0
      i32.load offset=4
      i32.const 16
      i32.sub
      local.tee 1
      i32.store offset=4
      local.get 1
      i32.const 0
      i32.store offset=12
      block  ;; label = @2
        loop  ;; label = @3
          local.get 1
          i32.load offset=12
          i32.const 15
          i32.gt_s
          br_if 1 (;@2;)
          block  ;; label = @4
            block  ;; label = @5
              local.get 1
              i32.load offset=12
              i32.const 92
              i32.mul
              i32.const 1687620
              i32.add
              f32.load
              local.tee 2
              f32.const 0x0p+0 (;=0;)
              f32.lt
              local.get 2
              local.get 2
              f32.ne
              i32.or
              br_if 0 (;@5;)
              local.get 1
              i32.load offset=12
              i32.const 92
              i32.mul
              i32.const 1687584
              i32.add
              call 2
              br 1 (;@4;)
            end
            local.get 1
            i32.load offset=12
            i32.const 92
            i32.mul
            local.tee 0
            i32.const 1687620
            i32.add
            i32.const 0
            i32.store
            local.get 0
            i32.const 1687624
            i32.add
            i32.const 0
            i32.store
          end
          block  ;; label = @4
            local.get 1
            i32.load offset=12
            i32.const 92
            i32.mul
            i32.const 1687620
            i32.add
            f32.load
            local.tee 2
            f32.const 0x1.19999ap+0 (;=1.1;)
            f32.lt
            local.get 2
            local.get 2
            f32.ne
            i32.or
            br_if 0 (;@4;)
            local.get 1
            i32.load offset=12
            i32.const 92
            i32.mul
            i32.const 1687624
            i32.add
            f32.load
            local.tee 2
            f32.const 0x0p+0 (;=0;)
            f32.le
            local.get 2
            local.get 2
            f32.ne
            i32.or
            br_if 0 (;@4;)
            local.get 1
            i32.load offset=12
            i32.const 92
            i32.mul
            i32.const 1687624
            i32.add
            i32.const -1296894724
            i32.store
          end
          local.get 1
          local.get 1
          i32.load offset=12
          i32.const 1
          i32.add
          i32.store offset=12
          br 0 (;@3;)
        end
        unreachable
      end
      i32.const 0
      local.get 1
      i32.const 16
      i32.add
      i32.store offset=4
    end)
  (func (;7;) (type 0) (param i32)
    (local i32)
    block  ;; label = @1
      i32.const 0
      i32.load offset=4
      i32.const 16
      i32.sub
      local.tee 1
      local.get 0
      i32.store offset=12
      local.get 1
      i32.const 0
      i32.load offset=1638416
      local.get 0
      i32.const 14
      i32.shl
      i32.add
      i32.store offset=8
    end)
  (func (;8;) (type 2) (result i32)
    i32.const 92)
  (table (;0;) 0 funcref)
  (export "wavetable_0dimensional_oscillator" (func 0))
  (export "wavetable_1dimensional_oscillator" (func 1))
  (export "wavetable_2dimensional_oscillator" (func 2))
  (export "wavetable_3dimensional_oscillator" (func 3))
  (export "sampleTableRef" (func 4))
  (export "init_oscillators" (func 5))
  (export "spin" (func 6))
  (export "loadBins" (func 7))
  (export "wavetable_struct_size" (func 8))
  (data (;0;) (i32.const 1638416) "\10\00\00\00")
  (data (;1;) (i32.const 1638432) "\00\00\00\00\00\00\00\00\00\00\00\00\10\22Y?\00\00\00\00\10\22i?\00\00\00\00\8c\d9r?\00\00\00\00\10\22y?\00\00\00\00\94j\7f?\00\00\00\00\8c\d9\82?\00\00\00\00\ce\fd\85?\00\00\00\00\10\22\89?\00\00\00\c0\cbE\8c?\00\00\00\c0\0dj\8f?\00\00\00\e0'G\91?\00\00\00\e0H\d9\92?\00\00\00\c0&k\94?\00\00\00\c0G\fd\95?\00\00\00\c0h\8f\97?\00\00\00\a0F!\99?\00\00\00\a0g\b3\9a?\00\00\00\80EE\9c?\00\00\00\80f\d7\9d?\00\00\00`Di\9f?\00\00\00 \91}\a0?\00\00\00 \80F\a1?\00\00\00\00o\0f\a2?\00\00\00\00^\d8\a2?\00\00\00\e0L\a1\a3?\00\00\00\e0;j\a4?\00\00\00\c0*3\a5?\00\00\00@\f8\fb\a5?\00\00\00 \e7\c4\a6?\00\00\00\80\b4\8d\a7?\00\00\00\e0\81V\a8?\00\00\00\e0p\1f\a9?\00\00\00@>\e8\a9?\00\00\00\a0\0b\b1\aa?\00\00\00\00\d9y\ab?\00\00\00\e0\84B\ac?\00\00\00@R\0b\ad?\00\00\00 \fe\d3\ad?\00\00\00\80\cb\9c\ae?\00\00\00`we\af?\00\00\00\a0\11\17\b0?\00\00\00\80g{\b0?\00\00\00\a0\ac\df\b0?\00\00\00\80\02D\b1?\00\00\00\c0G\a8\b1?\00\00\00\a0\9d\0c\b2?\00\00\00\c0\e2p\b2?\00\00\00\e0'\d5\b2?\00\00\00@\5c9\b3?\00\00\00`\a1\9d\b3?\00\00\00\c0\d5\01\b4?\00\00\00 \0af\b4?\00\00\00\80>\ca\b4?\00\00\00\e0r.\b5?\00\00\00@\a7\92\b5?\00\00\00\c0\ca\f6\b5?\00\00\00 \ffZ\b6?\00\00\00\c0\22\bf\b6?\00\00\00\805#\b7?\00\00\00 Y\87\b7?\00\00\00\00l\eb\b7?\00\00\00\c0~O\b8?\00\00\00\a0\91\b3\b8?\00\00\00`\a4\17\b9?\00\00\00@\b7{\b9?\00\00\00@\b9\df\b9?\00\00\00@\bbC\ba?\00\00\00@\bd\a7\ba?\00\00\00\80\ae\0b\bb?\00\00\00\c0\9fo\bb?\00\00\00\00\91\d3\bb?\00\00\00@\827\bc?\00\00\00\80s\9b\bc?\00\00\00\00T\ff\bc?\00\00\00\804c\bd?\00\00\00\00\15\c7\bd?\00\00\00\c0\e4*\be?\00\00\00`\b4\8e\be?\00\00\00 \84\f2\be?\00\00\00\c0SV\bf?\00\00\00\c0\12\ba\bf?\00\00\00\e0\e8\0e\c0?\00\00\00@\c8@\c0?\00\00\00`\9fr\c0?\00\00\00`v\a4\c0?\00\00\00\80M\d6\c0?\00\00\00\a0$\08\c1?\00\00\00@\f39\c1?\00\00\00\e0\c1k\c1?\00\00\00@\88\9d\c1?\00\00\00\80N\cf\c1?\00\00\00\e0\14\01\c2?\00\00\00 \db2\c2?\00\00\00\00\99d\c2?\00\00\00\e0V\96\c2?\00\00\00\80\0c\c8\c2?\00\00\00`\ca\f9\c2?\00\00\00\e0\7f+\c3?\00\00\00\00-]\c3?\00\00\00 \da\8e\c3?\00\00\00@\87\c0\c3?\00\00\00\00,\f2\c3?\00\00\00\c0\d0#\c4?\00\00\00\80uU\c4?\00\00\00\e0\11\87\c4?\00\00\00@\ae\b8\c4?\00\00\00\80J\ea\c4?\00\00\00\80\de\1b\c5?\00\00\00\80rM\c5?\00\00\00\00\fe~\c5?\00\00\00\a0\89\b0\c5?\00\00\00@\15\e2\c5?\00\00\00`\98\13\c6?\00\00\00\a0\1bE\c6?\00\00\00`\96v\c6?\00\00\00 \11\a8\c6?\00\00\00\00\8c\d9\c6?\00\00\00`\fe\0a\c7?\00\00\00\c0p<\c7?\00\00\00\c0\dam\c7?\00\00\00\e0D\9f\c7?\00\00\00\80\a6\d0\c7?\00\00\00 \08\02\c8?\00\00\00\c0i3\c8?\00\00\00\00\c3d\c8?\00\00\00\e0\13\96\c8?\00\00\00 m\c7\c8?\00\00\00\80\b5\f8\c8?\00\00\00`\06*\c9?\00\00\00\80F[\c9?\00\00\00\e0\8e\8c\c9?\00\00\00\00\cf\bd\c9?\00\00\00\c0\06\ef\c9?\00\00\00`> \ca?\00\00\00\c0mQ\ca?\00\00\00\00\9d\82\ca?\00\00\00@\cc\b3\ca?\00\00\00@\f3\e4\ca?\00\00\00\c0\11\16\cb?\00\00\00@0G\cb?\00\00\00\c0Nx\cb?\00\00\00\e0d\a9\cb?\00\00\00\a0r\da\cb?\00\00\00`\80\0b\cc?\00\00\00 \8e<\cc?\00\00\00\80\93m\cc?\00\00\00\80\90\9e\cc?\00\00\00\80\8d\cf\cc?\00\00\00\00\82\00\cd?\00\00\00\a0v1\cd?\00\00\00\c0bb\cd?\00\00\00\00O\93\cd?\00\00\00\c02\c4\cd?\00\00\00\a0\16\f5\cd?\00\00\00\00\f2%\ce?\00\00\00`\cdV\ce?\00\00\00\80\a0\87\ce?\00\00\00 k\b8\ce?\00\00\00\c05\e9\ce?\00\00\00\00\f8\19\cf?\00\00\00@\baJ\cf?\00\00\00 t{\cf?\00\00\00\00.\ac\cf?\00\00\00`\df\dc\cf?\00\00\00@\c4\06\d0?\00\00\00\c0\18\1f\d0?\00\00\00 i7\d0?\00\00\00\80\b9O\d0?\00\00\00\a0\05h\d0?\00\00\00\a0M\80\d0?\00\00\00\80\95\98\d0?\00\00\00`\d9\b0\d0?\00\00\00 \1d\c9\d0?\00\00\00\a0\5c\e1\d0?\00\00\00\00\98\f9\d0?\00\00\00`\d3\11\d1?\00\00\00\a0\0a*\d1?\00\00\00\a0=B\d1?\00\00\00\80pZ\d1?\00\00\00`\9fr\d1?\00\00\00 \ce\8a\d1?\00\00\00\c0\f8\a2\d1?\00\00\00 \1f\bb\d1?\00\00\00\80E\d3\d1?\00\00\00\c0g\eb\d1?\00\00\00\c0\85\03\d2?\00\00\00\c0\a3\1b\d2?\00\00\00\a0\bd3\d2?\00\00\00@\d3K\d2?\00\00\00\a0\e4c\d2?\00\00\00 \f6{\d2?\00\00\00\80\07\94\d2?\00\00\00\a0\10\ac\d2?\00\00\00\a0\19\c4\d2?\00\00\00\80\1e\dc\d2?\00\00\00`#\f4\d2?\00\00\00\00$\0c\d3?\00\00\00\80 $\d3?\00\00\00\c0\18<\d3?\00\00\00\00\11T\d3?\00\00\00\00\05l\d3?\00\00\00\e0\f4\83\d3?\00\00\00\c0\e4\9b\d3?\00\00\00\80\d0\b3\d3?\00\00\00\00\b8\cb\d3?\00\00\00@\9b\e3\d3?\00\00\00\a0~\fb\d3?\00\00\00\a0]\13\d4?\00\00\00\a08+\d4?\00\00\00@\0fC\d4?\00\00\00\00\e6Z\d4?\00\00\00\80\b8r\d4?\00\00\00\e0\86\8a\d4?\00\00\00 U\a2\d4?\00\00\00 \1b\ba\d4?\00\00\00\00\e1\d1\d4?\00\00\00\c0\a2\e9\d4?\00\00\00\80d\01\d5?\00\00\00\e0\1d\19\d5?\00\00\00@\d70\d5?\00\00\00`\8cH\d5?\00\00\00\80A`\d5?\00\00\00@\eew\d5?\00\00\00 \9b\8f\d5?\00\00\00\a0C\a7\d5?\00\00\00\00\e8\be\d5?\00\00\00@\88\d6\d5?\00\00\00`(\ee\d5?\00\00\00@\c0\05\d6?\00\00\00\00X\1d\d6?\00\00\00\a0\eb4\d6?\00\00\00@\7fL\d6?\00\00\00`\0ad\d6?\00\00\00\a0\95{\d6?\00\00\00\a0\1c\93\d6?\00\00\00\80\9f\aa\d6?\00\00\00 \1e\c2\d6?\00\00\00\80\98\d9\d6?\00\00\00\c0\0e\f1\d6?\00\00\00\00\85\08\d7?\00\00\00 \f7\1f\d7?\00\00\00\00e7\d7?\00\00\00\a0\ceN\d7?\00\00\00 4f\d7?\00\00\00`\95}\d7?\00\00\00\a0\f6\94\d7?\00\00\00\80O\ac\d7?\00\00\00`\a8\c3\d7?\00\00\00 \fd\da\d7?\00\00\00\80M\f2\d7?\00\00\00\e0\99\09\d8?\00\00\00\00\e2 \d8?\00\00\00 *8\d8?\00\00\00\c0iO\d8?\00\00\00\80\a9f\d8?\00\00\00\e0\e0}\d8?\00\00\00 \18\95\d8?\00\00\00@K\ac\d8?\00\00\00@z\c3\d8?\00\00\00\00\a5\da\d8?\00\00\00\80\cb\f1\d8?\00\00\00\e0\ed\08\d9?\00\00\00@\10 \d9?\00\00\00@*7\d9?\00\00\00\00@N\d9?\00\00\00\c0Ue\d9?\00\00\00`g|\d9?\00\00\00\80p\93\d9?\00\00\00\c0y\aa\d9?\00\00\00\c0~\c1\d9?\00\00\00`{\d8\d9?\00\00\00\00x\ef\d9?\00\00\00`p\06\da?\00\00\00\a0d\1d\da?\00\00\00\a0T4\da?\00\00\00\80@K\da?\00\00\00 (b\da?\00\00\00\80\0by\da?\00\00\00\c0\ea\8f\da?\00\00\00\00\ca\a6\da?\00\00\00\e0\a0\bd\da?\00\00\00\80s\d4\da?\00\00\00\00B\eb\da?\00\00\00@\0c\02\db?\00\00\00`\d2\18\db?\00\00\00\80\98/\db?\00\00\00 VF\db?\00\00\00\a0\0f]\db?\00\00\00\00\c5s\db?\00\00\00 v\8a\db?\00\00\00 '\a1\db?\00\00\00\e0\cf\b7\db?\00\00\00`t\ce\db?\00\00\00\c0\14\e5\db?\00\00\00\e0\b0\fb\db?\00\00\00\e0H\12\dc?\00\00\00\a0\dc(\dc?\00\00\00 l?\dc?\00\00\00\80\f7U\dc?\00\00\00\a0~l\dc?\00\00\00\a0\01\83\dc?\00\00\00`\80\99\dc?\00\00\00\00\fb\af\dc?\00\00\00@m\c6\dc?\00\00\00`\df\dc\dc?\00\00\00`M\f3\dc?\00\00\00\00\b3\09\dd?\00\00\00\a0\18 \dd?\00\00\00\e0u6\dd?\00\00\00\e0\ceL\dd?\00\00\00\e0'c\dd?\00\00\00\a0xy\dd?\00\00\00\00\c5\8f\dd?\00\00\00@\0d\a6\dd?\00\00\00`Q\bc\dd?\00\00\00\00\8d\d2\dd?\00\00\00\a0\c8\e8\dd?\00\00\00 \00\ff\dd?\00\00\00@/\15\de?\00\00\00`^+\de?\00\00\00\00\85A\de?\00\00\00\80\a7W\de?\00\00\00\e0\c5m\de?\00\00\00\00\e0\83\de?\00\00\00\e0\f5\99\de?\00\00\00\a0\07\b0\de?\00\00\00\00\11\c6\de?\00\00\00@\1a\dc\de?\00\00\00@\1b\f2\de?\00\00\00\00\18\08\df?\00\00\00\80\10\1e\df?\00\00\00\e0\044\df?\00\00\00 \f5I\df?\00\00\00\e0\dc_\df?\00\00\00\a0\c4u\df?\00\00\00\00\a4\8b\df?\00\00\00@\7f\a1\df?\00\00\00@V\b7\df?\00\00\00 )\cd\df?\00\00\00\c0\f7\e2\df?\00\00\00\e0\bd\f8\df?\00\00\00\00@\07\e0?\00\00\00\e0\1e\12\e0?\00\00\00\c0\fb\1c\e0?\00\00\00\80\d6'\e0?\00\00\00 \af2\e0?\00\00\00\80\83=\e0?\00\00\00\e0UH\e0?\00\00\00 &S\e0?\00\00\00@\f4]\e0?\00\00\00 \beh\e0?\00\00\00 \88s\e0?\00\00\00\e0M~\e0?\00\00\00\80\11\89\e0?\00\00\00 \d3\93\e0?\00\00\00\80\90\9e\e0?\00\00\00\c0K\a9\e0?\00\00\00\e0\04\b4\e0?\00\00\00\00\bc\be\e0?\00\00\00\00q\c9\e0?\00\00\00\c0!\d4\e0?\00\00\00`\d0\de\e0?\00\00\00\00}\e9\e0?\00\00\00\80'\f4\e0?\00\00\00\e0\cd\fe\e0?\00\00\00\00r\09\e1?\00\00\00 \14\14\e1?\00\00\00 \b4\1e\e1?\00\00\00\00P)\e1?\00\00\00\a0\e93\e1?\00\00\00@\81>\e1?\00\00\00\c0\14I\e1?\00\00\00 \a8S\e1?\00\00\00`7^\e1?\00\00\00\80\c4h\e1?\00\00\00`Ms\e1?\00\00\00@\d4}\e1?\00\00\00\00Y\88\e1?\00\00\00\a0\db\92\e1?\00\00\00 Z\9d\e1?\00\00\00\80\d6\a7\e1?\00\00\00\c0P\b2\e1?\00\00\00\c0\c6\bc\e1?\00\00\00\c0:\c7\e1?\00\00\00\a0\ac\d1\e1?\00\00\00`\1c\dc\e1?\00\00\00\00\88\e6\e1?\00\00\00`\f1\f0\e1?\00\00\00\c0V\fb\e1?\00\00\00\e0\b9\05\e2?\00\00\00\00\1b\10\e2?\00\00\00\00z\1a\e2?\00\00\00\c0\d4$\e2?\00\00\00\80-/\e2?\00\00\00 \849\e2?\00\00\00\80\d6C\e2?\00\00\00\e0&N\e2?\00\00\00\00sX\e2?\00\00\00\00\bdb\e2?\00\00\00\e0\04m\e2?\00\00\00\c0Jw\e2?\00\00\00`\8c\81\e2?\00\00\00\e0\cb\8b\e2?\00\00\00@\07\96\e2?\00\00\00\80@\a0\e2?\00\00\00\a0w\aa\e2?\00\00\00\a0\aa\b4\e2?\00\00\00\80\db\be\e2?\00\00\00 \08\c9\e2?\00\00\00\c04\d3\e2?\00\00\00 [\dd\e2?\00\00\00\80\81\e7\e2?\00\00\00\c0\a3\f1\e2?\00\00\00\a0\c1\fb\e2?\00\00\00\80\dd\05\e3?\00\00\00`\f7\0f\e3?\00\00\00\00\0f\1a\e3?\00\00\00\80\22$\e3?\00\00\00\e01.\e3?\00\00\00\00?8\e3?\00\00\00 JB\e3?\00\00\00 SL\e3?\00\00\00\00XV\e3?\00\00\00\a0X`\e3?\00\00\00 Wj\e3?\00\00\00\80St\e3?\00\00\00\c0K~\e3?\00\00\00\e0A\88\e3?\00\00\00\e03\92\e3?\00\00\00\c0#\9c\e3?\00\00\00\80\11\a6\e3?\00\00\00\00\fb\af\e3?\00\00\00`\e0\b9\e3?\00\00\00\a0\c3\c3\e3?\00\00\00\c0\a4\cd\e3?\00\00\00\c0\81\d7\e3?\00\00\00\a0\5c\e1\e3?\00\00\00`3\eb\e3?\00\00\00\e0\07\f5\e3?\00\00\00@\d8\fe\e3?\00\00\00\a0\a6\08\e4?\00\00\00\c0r\12\e4?\00\00\00\c0:\1c\e4?\00\00\00\a0\fe%\e4?\00\00\00@\c0/\e4?\00\00\00\e0\7f9\e4?\00\00\00`;C\e4?\00\00\00\80\f2L\e4?\00\00\00\a0\a7V\e4?\00\00\00\c0Z`\e4?\00\00\00\80\09j\e4?\00\00\00 \b4s\e4?\00\00\00\c0\5c}\e4?\00\00\00 \03\87\e4?\00\00\00`\a5\90\e4?\00\00\00\a0E\9a\e4?\00\00\00\80\e1\a3\e4?\00\00\00@y\ad\e4?\00\00\00\00\0f\b7\e4?\00\00\00`\a0\c0\e4?\00\00\00\c0/\ca\e4?\00\00\00 \bd\d3\e4?\00\00\00 F\dd\e4?\00\00\00 \cb\e6\e4?\00\00\00\e0M\f0\e4?\00\00\00\80\cc\f9\e4?\00\00\00\00I\03\e5?\00\00\00@\c1\0c\e5?\00\00\00`5\16\e5?\00\00\00`\a7\1f\e5?\00\00\00`\17)\e5?\00\00\00\00\832\e5?\00\00\00\a0\ea;\e5?\00\00\00\00PE\e5?\00\00\00@\b1N\e5?\00\00\00`\10X\e5?\00\00\00`ka\e5?\00\00\00 \c4j\e5?\00\00\00\e0\18t\e5?\00\00\00@i}\e5?\00\00\00\a0\b7\86\e5?\00\00\00\e0\01\90\e5?\00\00\00\e0I\99\e5?\00\00\00\c0\8d\a2\e5?\00\00\00\80\cd\ab\e5?\00\00\00\00\0b\b5\e5?\00\00\00\80D\be\e5?\00\00\00\c0{\c7\e5?\00\00\00\e0\ae\d0\e5?\00\00\00\e0\df\d9\e5?\00\00\00\a0\0a\e3\e5?\00\00\00@5\ec\e5?\00\00\00\c0Y\f5\e5?\00\00\00\00|\fe\e5?\00\00\00@\9c\07\e6?\00\00\00@\b8\10\e6?\00\00\00 \d0\19\e6?\00\00\00\c0\e3\22\e6?\00\00\00`\f5+\e6?\00\00\00\a0\025\e6?\00\00\00\e0\0d>\e6?\00\00\00\00\15G\e6?\00\00\00\00\1aP\e6?\00\00\00\a0\18Y\e6?\00\00\00@\15b\e6?\00\00\00\a0\0fk\e6?\00\00\00\00\06t\e6?\00\00\00\00\f8|\e6?\00\00\00\00\e6\85\e6?\00\00\00\c0\d1\8e\e6?\00\00\00`\b9\97\e6?\00\00\00\e0\9e\a0\e6?\00\00\00 \80\a9\e6?\00\00\00@]\b2\e6?\00\00\00@6\bb\e6?\00\00\00\00\0d\c4\e6?\00\00\00\a0\df\cc\e6?\00\00\00@\b0\d5\e6?\00\00\00\80|\de\e6?\00\00\00\c0D\e7\e6?\00\00\00\a0\08\f0\e6?\00\00\00\80\ca\f8\e6?\00\00\00 \88\01\e7?\00\00\00\c0C\0a\e7?\00\00\00\00\f9\12\e7?\00\00\00 \ac\1b\e7?\00\00\00 [$\e7?\00\00\00\00\08-\e7?\00\00\00\c0\b05\e7?\00\00\00@U>\e7?\00\00\00\a0\f7F\e7?\00\00\00\c0\93O\e7?\00\00\00\c0-X\e7?\00\00\00\a0\c5`\e7?\00\00\00@Wi\e7?\00\00\00\c0\e6q\e7?\00\00\00 rz\e7?\00\00\00`\fb\82\e7?\00\00\00`\80\8b\e7?\00\00\00@\01\94\e7?\00\00\00\e0}\9c\e7?\00\00\00`\f6\a4\e7?\00\00\00\c0l\ad\e7?\00\00\00\e0\de\b5\e7?\00\00\00\e0L\be\e7?\00\00\00\c0\b8\c6\e7?\00\00\00` \cf\e7?\00\00\00\e0\83\d7\e7?\00\00\00 \e3\df\e7?\00\00\00`@\e8\e7?\00\00\00@\97\f0\e7?\00\00\00\00\ec\f8\e7?\00\00\00\c0>\01\e8?\00\00\00 \8b\09\e8?\00\00\00\80\d5\11\e8?\00\00\00\a0\1b\1a\e8?\00\00\00\80]\22\e8?\00\00\00@\9b*\e8?\00\00\00\e0\d62\e8?\00\00\00`\0e;\e8?\00\00\00\a0AC\e8?\00\00\00\a0pK\e8?\00\00\00\a0\9dS\e8?\00\00\00@\c4[\e8?\00\00\00\e0\e8c\e8?\00\00\00@\09l\e8?\00\00\00\80't\e8?\00\00\00\80?|\e8?\00\00\00`U\84\e8?\00\00\00 g\8c\e8?\00\00\00\a0t\94\e8?\00\00\00\e0}\9c\e8?\00\00\00 \85\a4\e8?\00\00\00 \88\ac\e8?\00\00\00\e0\84\b4\e8?\00\00\00\80\7f\bc\e8?\00\00\00\00x\c4\e8?\00\00\00@j\cc\e8?\00\00\00`Z\d4\e8?\00\00\00@D\dc\e8?\00\00\00\00,\e4\e8?\00\00\00\a0\11\ec\e8?\00\00\00\00\f1\f3\e8?\00\00\00 \cc\fb\e8?\00\00\00@\a5\03\e9?\00\00\00 z\0b\e9?\00\00\00\c0J\13\e9?\00\00\00@\17\1b\e9?\00\00\00\a0\df\22\e9?\00\00\00\a0\a3*\e9?\00\00\00\a0e2\e9?\00\00\00`!:\e9?\00\00\00\00\dbA\e9?\00\00\00`\90I\e9?\00\00\00\a0AQ\e9?\00\00\00\c0\f0X\e9?\00\00\00\a0\99`\e9?\00\00\00@>h\e9?\00\00\00\c0\e0o\e9?\00\00\00 \7fw\e9?\00\00\00`\19\7f\e9?\00\00\00@\af\86\e9?\00\00\00\00A\8e\e9?\00\00\00\a0\ce\95\e9?\00\00\00 Z\9d\e9?\00\00\00@\df\a4\e9?\00\00\00`b\ac\e9?\00\00\00@\e1\b3\e9?\00\00\00\e0Y\bb\e9?\00\00\00`\d0\c2\e9?\00\00\00\a0B\ca\e9?\00\00\00\e0\b2\d1\e9?\00\00\00\e0\1c\d9\e9?\00\00\00\80\82\e0\e9?\00\00\00 \e6\e7\e9?\00\00\00\80C\ef\e9?\00\00\00\c0\9e\f6\e9?\00\00\00\c0\f5\fd\e9?\00\00\00\a0F\05\ea?\00\00\00@\95\0c\ea?\00\00\00\c0\df\13\ea?\00\00\00\00&\1b\ea?\00\00\00 j\22\ea?\00\00\00\00\a8)\ea?\00\00\00\c0\e10\ea?\00\00\00@\198\ea?\00\00\00\a0J?\ea?\00\00\00\c0yF\ea?\00\00\00\c0\a2M\ea?\00\00\00\80\c9T\ea?\00\00\00 \ec[\ea?\00\00\00\80\08c\ea?\00\00\00\c0\22j\ea?\00\00\00\c08q\ea?\00\00\00\a0Jx\ea?\00\00\00@X\7f\ea?\00\00\00\a0a\86\ea?\00\00\00\00g\8d\ea?\00\00\00\00h\94\ea?\00\00\00\00g\9b\ea?\00\00\00\a0_\a2\ea?\00\00\00 T\a9\ea?\00\00\00\80F\b0\ea?\00\00\00\a02\b7\ea?\00\00\00\80\1a\be\ea?\00\00\00@\00\c5\ea?\00\00\00\e0\df\cb\ea?\00\00\00@\bd\d2\ea?\00\00\00`\94\d9\ea?\00\00\00`i\e0\ea?\00\00\00 8\e7\ea?\00\00\00\c0\04\ee\ea?\00\00\00@\cd\f4\ea?\00\00\00`\8f\fb\ea?\00\00\00`O\02\eb?\00\00\00@\0b\09\eb?\00\00\00\e0\c0\0f\eb?\00\00\00@t\16\eb?\00\00\00\a0#\1d\eb?\00\00\00\80\cc#\eb?\00\00\00\80s*\eb?\00\00\00 \161\eb?\00\00\00\80\b27\eb?\00\00\00\e0L>\eb?\00\00\00\00\e3D\eb?\00\00\00\e0tK\eb?\00\00\00\80\00R\eb?\00\00\00\00\8aX\eb?\00\00\00`\0f_\eb?\00\00\00`\8ee\eb?\00\00\00`\0bl\eb?\00\00\00 \84r\eb?\00\00\00\80\f6x\eb?\00\00\00\e0f\7f\eb?\00\00\00\00\d1\85\eb?\00\00\00\009\8c\eb?\00\00\00\a0\9a\92\eb?\00\00\00@\fa\98\eb?\00\00\00\80S\9f\eb?\00\00\00\c0\aa\a5\eb?\00\00\00\a0\fb\ab\eb?\00\00\00`J\b2\eb?\00\00\00\e0\92\b8\eb?\00\00\00@\d7\be\eb?\00\00\00`\17\c5\eb?\00\00\00`U\cb\eb?\00\00\00 \8d\d1\eb?\00\00\00\c0\c0\d7\eb?\00\00\00\00\f0\dd\eb?\00\00\00@\1b\e4\eb?\00\00\00 B\ea\eb?\00\00\00\e0d\f0\eb?\00\00\00\80\83\f6\eb?\00\00\00\e0\9d\fc\eb?\00\00\00\00\b2\02\ec?\00\00\00\00\c4\08\ec?\00\00\00\c0\d1\0e\ec?\00\00\00@\d9\14\ec?\00\00\00\a0\de\1a\ec?\00\00\00\c0\dd \ec?\00\00\00\c0\da&\ec?\00\00\00\80\d1,\ec?\00\00\00\00\c42\ec?\00\00\00`\b28\ec?\00\00\00\80\9c>\ec?\00\00\00\80\82D\ec?\00\00\00@dJ\ec?\00\00\00\c0AP\ec?\00\00\00 \1bV\ec?\00\00\00`\f0[\ec?\00\00\00@\bfa\ec?\00\00\00\00\8cg\ec?\00\00\00\80Rm\ec?\00\00\00\c0\14s\ec?\00\00\00\00\d5x\ec?\00\00\00\e0\8e~\ec?\00\00\00\a0D\84\ec?\00\00\00 \f6\89\ec?\00\00\00\80\a3\8f\ec?\00\00\00\80J\95\ec?\00\00\00`\ef\9a\ec?\00\00\00 \8e\a0\ec?\00\00\00\a0*\a6\ec?\00\00\00\e0\c0\ab\ec?\00\00\00\00S\b1\ec?\00\00\00\e0\e2\b6\ec?\00\00\00\a0l\bc\ec?\00\00\00\00\f0\c1\ec?\00\00\00@q\c7\ec?\00\00\00`\ee\cc\ec?\00\00\00 e\d2\ec?\00\00\00\e0\d9\d7\ec?\00\00\00@H\dd\ec?\00\00\00\80\b2\e2\ec?\00\00\00\80\18\e8\ec?\00\00\00`z\ed\ec?\00\00\00\00\d8\f2\ec?\00\00\00`1\f8\ec?\00\00\00\a0\84\fd\ec?\00\00\00\a0\d5\02\ed?\00\00\00` \08\ed?\00\00\00\00g\0d\ed?\00\00\00@\a9\12\ed?\00\00\00\80\e7\17\ed?\00\00\00\80!\1d\ed?\00\00\00 U\22\ed?\00\00\00\c0\86'\ed?\00\00\00\00\b2,\ed?\00\00\00 \d91\ed?\00\00\00 \fc6\ed?\00\00\00\c0\1a<\ed?\00\00\00`5A\ed?\00\00\00\a0IF\ed?\00\00\00\c0[K\ed?\00\00\00\80gP\ed?\00\00\00@oU\ed?\00\00\00\a0rZ\ed?\00\00\00\e0q_\ed?\00\00\00\e0jd\ed?\00\00\00\c0ai\ed?\00\00\00`Rn\ed?\00\00\00\c0>s\ed?\00\00\00\e0&x\ed?\00\00\00\e0\0a}\ed?\00\00\00\c0\ea\81\ed?\00\00\00@\c4\86\ed?\00\00\00\a0\99\8b\ed?\00\00\00\c0l\90\ed?\00\00\00\a07\95\ed?\00\00\00`\00\9a\ed?\00\00\00\e0\c4\9e\ed?\00\00\00 \83\a3\ed?\00\00\00@=\a8\ed?\00\00\00 \f5\ac\ed?\00\00\00\c0\a4\b1\ed?\00\00\00@R\b6\ed?\00\00\00\80\fb\ba\ed?\00\00\00\80\9e\bf\ed?\00\00\00@=\c4\ed?\00\00\00\e0\d7\c8\ed?\00\00\00@n\cd\ed?\00\00\00`\fe\d1\ed?\00\00\00`\8c\d6\ed?\00\00\00 \14\db\ed?\00\00\00\a0\97\df\ed?\00\00\00\00\17\e4\ed?\00\00\00\00\90\e8\ed?\00\00\00\00\07\ed\ed?\00\00\00\a0w\f1\ed?\00\00\00 \e4\f5\ed?\00\00\00@J\fa\ed?\00\00\00`\ae\fe\ed?\00\00\00 \0c\03\ee?\00\00\00\e0g\07\ee?\00\00\00 \bb\0b\ee?\00\00\00`\0c\10\ee?\00\00\00`Y\14\ee?\00\00\00\00\a0\18\ee?\00\00\00\80\e2\1c\ee?\00\00\00\e0 !\ee?\00\00\00\00[%\ee?\00\00\00\e0\8e)\ee?\00\00\00\80\be-\ee?\00\00\00\00\ea1\ee?\00\00\00@\116\ee?\00\00\00@4:\ee?\00\00\00\00Q>\ee?\00\00\00\a0iB\ee?\00\00\00\00~F\ee?\00\00\00 \8eJ\ee?\00\00\00 \98N\ee?\00\00\00\e0\9fR\ee?\00\00\00`\a1V\ee?\00\00\00\a0\9cZ\ee?\00\00\00\c0\95^\ee?\00\00\00\80\88b\ee?\00\00\00 wf\ee?\00\00\00\a0aj\ee?\00\00\00\e0Gn\ee?\00\00\00\e0'r\ee?\00\00\00\a0\03v\ee?\00\00\00 \dby\ee?\00\00\00\80\ae}\ee?\00\00\00\a0{\81\ee?\00\00\00\80D\85\ee?\00\00\00 \09\89\ee?\00\00\00\a0\c9\8c\ee?\00\00\00\e0\83\90\ee?\00\00\00\e09\94\ee?\00\00\00\a0\eb\97\ee?\00\00\00@\99\9b\ee?\00\00\00\a0@\9f\ee?\00\00\00\e0\e5\a2\ee?\00\00\00\c0\82\a6\ee?\00\00\00\80\1d\aa\ee?\00\00\00\e0\b1\ad\ee?\00\00\00@D\b1\ee?\00\00\00`\d0\b4\ee?\00\00\00 V\b8\ee?\00\00\00\c0\d9\bb\ee?\00\00\00 W\bf\ee?\00\00\00@\ce\c2\ee?\00\00\00@C\c6\ee?\00\00\00\00\b2\c9\ee?\00\00\00\80\1c\cd\ee?\00\00\00\c0\82\d0\ee?\00\00\00\e0\e4\d3\ee?\00\00\00\c0@\d7\ee?\00\00\00`\98\da\ee?\00\00\00\e0\eb\dd\ee?\00\00\00\009\e1\ee?\00\00\00\00\82\e4\ee?\00\00\00\c0\c6\e7\ee?\00\00\00@\07\eb\ee?\00\00\00\a0A\ee\ee?\00\00\00\a0w\f1\ee?\00\00\00\80\a9\f4\ee?\00\00\00@\d7\f7\ee?\00\00\00\a0\fe\fa\ee?\00\00\00\e0!\fe\ee?\00\00\00\e0@\01\ef?\00\00\00\a0Y\04\ef?\00\00\00 n\07\ef?\00\00\00\80~\0a\ef?\00\00\00\a0\8a\0d\ef?\00\00\00\80\90\10\ef?\00\00\00 \92\13\ef?\00\00\00\80\8f\16\ef?\00\00\00\c0\86\19\ef?\00\00\00\c0y\1c\ef?\00\00\00\80h\1f\ef?\00\00\00 S\22\ef?\00\00\00`7%\ef?\00\00\00\80\17(\ef?\00\00\00`\f3*\ef?\00\00\00\00\c9-\ef?\00\00\00\80\9c0\ef?\00\00\00\a0g3\ef?\00\00\00\a006\ef?\00\00\00`\f38\ef?\00\00\00\00\b2;\ef?\00\00\00@l>\ef?\00\00\00` A\ef?\00\00\00@\d0C\ef?\00\00\00\e0{F\ef?\00\00\00@!I\ef?\00\00\00\80\c4K\ef?\00\00\00\80_N\ef?\00\00\00@\f8P\ef?\00\00\00\c0\8aS\ef?\00\00\00 \19V\ef?\00\00\00 \a3X\ef?\00\00\00\00'[\ef?\00\00\00\a0\a6]\ef?\00\00\00 \22`\ef?\00\00\00@\97b\ef?\00\00\00 \08e\ef?\00\00\00\e0tg\ef?\00\00\00\80\ddi\ef?\00\00\00\c0?l\ef?\00\00\00\e0\9dn\ef?\00\00\00\a0\f5p\ef?\00\00\00`Ks\ef?\00\00\00\a0\98u\ef?\00\00\00\e0\e3w\ef?\00\00\00\c0(z\ef?\00\00\00\80i|\ef?\00\00\00\00\a6~\ef?\00\00\00@\dc\80\ef?\00\00\00`\10\83\ef?\00\00\00 <\85\ef?\00\00\00\c0e\87\ef?\00\00\00 \89\89\ef?\00\00\00@\a8\8b\ef?\00\00\00 \c1\8d\ef?\00\00\00\c0\d5\8f\ef?\00\00\00@\e6\91\ef?\00\00\00\80\f0\93\ef?\00\00\00\80\f8\95\ef?\00\00\00@\f8\97\ef?\00\00\00\e0\f5\99\ef?\00\00\00@\ed\9b\ef?\00\00\00`\e0\9d\ef?\00\00\00@\cf\9f\ef?\00\00\00\e0\b7\a1\ef?\00\00\00`\9c\a3\ef?\00\00\00\80z\a5\ef?\00\00\00\80V\a7\ef?\00\00\00@*\a9\ef?\00\00\00\c0\fb\aa\ef?\00\00\00\00\c7\ac\ef?\00\00\00 \8e\ae\ef?\00\00\00\00Q\b0\ef?\00\00\00\a0\0d\b2\ef?\00\00\00\00\c6\b3\ef?\00\00\00@z\b5\ef?\00\00\00 (\b7\ef?\00\00\00\e0\d1\b8\ef?\00\00\00@u\ba\ef?\00\00\00\a0\16\bc\ef?\00\00\00\a0\b1\bd\ef?\00\00\00`F\bf\ef?\00\00\00\00\d9\c0\ef?\00\00\00`e\c2\ef?\00\00\00\80\eb\c3\ef?\00\00\00`m\c5\ef?\00\00\00\00\eb\c6\ef?\00\00\00\80d\c8\ef?\00\00\00\c0\d7\c9\ef?\00\00\00\c0F\cb\ef?\00\00\00\80\b1\cc\ef?\00\00\00\00\16\ce\ef?\00\00\00`v\cf\ef?\00\00\00`\d0\d0\ef?\00\00\00`(\d2\ef?\00\00\00\00z\d3\ef?\00\00\00`\c5\d4\ef?\00\00\00\80\0c\d6\ef?\00\00\00\80O\d7\ef?\00\00\00@\8e\d8\ef?\00\00\00\c0\c6\d9\ef?\00\00\00\00\fb\da\ef?\00\00\00\00)\dc\ef?\00\00\00\c0R\dd\ef?\00\00\00`x\de\ef?\00\00\00\c0\99\df\ef?\00\00\00\e0\b4\e0\ef?\00\00\00\c0\cb\e1\ef?\00\00\00`\dc\e2\ef?\00\00\00\e0\e8\e3\ef?\00\00\00 \f1\e4\ef?\00\00\00\00\f3\e5\ef?\00\00\00\c0\f0\e6\ef?\00\00\00`\ea\e7\ef?\00\00\00\a0\dd\e8\ef?\00\00\00\c0\cc\e9\ef?\00\00\00\a0\b7\ea\ef?\00\00\00@\9c\eb\ef?\00\00\00\a0|\ec\ef?\00\00\00\c0X\ed\ef?\00\00\00\c0.\ee\ef?\00\00\00`\00\ef\ef?\00\00\00\e0\cd\ef\ef?\00\00\00 \95\f0\ef?\00\00\00@X\f1\ef?\00\00\00\00\17\f2\ef?\00\00\00\a0\cf\f2\ef?\00\00\00\00\84\f3\ef?\00\00\00\002\f4\ef?\00\00\00\e0\db\f4\ef?\00\00\00\80\81\f5\ef?\00\00\00\e0 \f6\ef?\00\00\00@\be\f6\ef?\00\00\00 S\f7\ef?\00\00\00\e0\e5\f7\ef?\00\00\00`r\f8\ef?\00\00\00\a0\f8\f8\ef?\00\00\00\c0|\f9\ef?\00\00\00\a0\fa\f9\ef?\00\00\00 r\fa\ef?\00\00\00\a0\e7\fa\ef?\00\00\00\c0V\fb\ef?\00\00\00\a0\bf\fb\ef?\00\00\00@$\fc\ef?\00\00\00\c0\84\fc\ef?\00\00\00\00\e1\fc\ef?\00\00\00\007\fd\ef?\00\00\00\c0\88\fd\ef?\00\00\00@\d4\fd\ef?\00\00\00\80\1b\fe\ef?\00\00\00\a0^\fe\ef?\00\00\00\a0\9d\fe\ef?\00\00\00@\d6\fe\ef?\00\00\00\80\08\ff\ef?\00\00\00\c08\ff\ef?\00\00\00\c0b\ff\ef?\00\00\00`\86\ff\ef?\00\00\00\e0\a7\ff\ef?\00\00\00 \c3\ff\ef?\00\00\00 \d8\ff\ef?\00\00\00\e0\e8\ff\ef?\00\00\00\80\f5\ff\ef?\00\00\00\e0\fd\ff\ef?"))
