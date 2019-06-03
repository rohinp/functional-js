const ty = _$.types;
    const func = _$.func
    const arr = _$.arr
    const dTypes = _$.derivedTypes

    suite("fp-test", function () {
        test("Identity is a function that always returns the same value that was used as its arguments", function() {
          assert.equal(func.id(1), 1);
        });

        test("Compose is a function to compose any two single parameter function", function() {
          const f = x => x * x
          const g = x => x + 2
          //read as g after f
          assert.equal(func.compose(f,g)(2), 6);
        });

        test("Option type constructors examples", function() {
          assert.equal(ty.Option(undefined).inspect(), 'None');
          assert.equal(ty.Option(null).inspect(), 'None');
          assert.equal(ty.Option(12).inspect(), 'Some(12)');
          assert.equal(ty.Some(12).inspect(), 'Some(12)');
        });

        test("Some and None map function usage",function(){
          assert.equal(ty.Some(12).map(x => x + 2).inspect(), 'Some(14)');
          assert.equal(ty.None.map(x => x + 2).inspect(), 'None');
        });

        test("Some and None map & bind function usage",function(){
          const data = {
            "apartment": {
              "rooms": {
                "bedrooms":2,
                "living":1
              }
            }
          };
          const ifAllKeyDefined = ty.Option(data)
                                    .fmap(d => ty.Option(d.apartment))
                                    .fmap(a => ty.Option(a.rooms))
                                    .fmap(r => ty.Option(r.bedrooms))
                                    .map(b => b + 1)

          assert.equal(ifAllKeyDefined.inspect(), 'Some(3)');

          const ifKeyUndefinedSenario = ty.Option(data)
                                          .fmap(d => ty.Option(d.apartment))
                                          .fmap(a => ty.Option(a.rooms))
                                          .fmap(r => ty.Option(r.kitchen))
                                          .map(b => b + 1)

          assert.equal(ifKeyUndefinedSenario.inspect(), 'None');
        });

        test("Some and None map & bind function usage 2",function(){
          const someStringToParse1 = "12"
          const someStringToParse2 = "a12"
          // not declarative and non functional way could have been something like this
          /*
          const notSoFunctionalJS = str => {
            if(!!someStringToParse1) { 
              const result = parseInt(someStringToParse1)
              if(isNAN(result)){
                //dont know how to represent faliure
                return -1;
              }else {
                return result * 2;
              }
            }else {
              //dont know how to represent faliure
              return -1;
            }
          }*/
          
          const parseAndProcess = str => ty.Some(str)
                                            .fmap(s => func.parseIntO(s))
                                            .map(d => d + 2)
                                          
          assert.equal(parseAndProcess(someStringToParse1).inspect(), 'Some(14)');
          assert.equal(parseAndProcess(someStringToParse2).inspect(), ty.None.inspect());
        });

        test("checkListOfOptions function usage",function() {
          assert.equal(arr.checkListOfOptions(undefined), false);
          assert.equal(arr.checkListOfOptions([ty.Some(1),ty.None,ty.Some(2)]), false);
          assert.equal(arr.checkListOfOptions([ty.None,ty.None]), false);
          assert.equal(arr.checkListOfOptions([ty.Some(1),ty.Some(2)]), true);
        });

        test("head, tail, headO and tailO function usage", function() {
          assert.equal(arr.head([1,2]), 1);
          assert.equal(arr.headO([]).inspect(), 'None');
          assert.equal(arr.headO([1,2]).inspect(), 'Some(1)');
          assert.deepEqual(arr.tail([1,2,3]), [2,3]);
          assert.deepEqual(arr.tail([1]), []);
          assert.equal(arr.tailO([]).inspect(), 'None');
          assert.equal(arr.tailO([1,2,3]).inspect(), 'Some(2,3)');
        });

        test("Tuple usage, fst and snd function",function() {
          assert.deepEqual(ty.tuple(1,2),[1,2]);
          assert.equal(func.fst(ty.tuple(1,2)), 1);
          assert.equal(func.snd(ty.tuple(1,2)), 2);
        });

        test("isEmpty and nonEmptyList",function(){
          assert.equal(arr.isEmpty([1,2]),false)
          assert.equal(arr.isEmpty([]),true)
          assert.equal(arr.nonEmptyList([1,2]).inspect(),'Some(1,2)')
          assert.equal(arr.nonEmptyList([]).inspect(),'None')
        })

        test("matchFirst function usage",function(){
          const dataArr = [{"x":1,"y":2},{"x":3,"y":4},{"x":5,"y":6},{"x":7,"y":8}];
          const findingArr = [5,3]
          
          assert.deepEqual(arr.matchFirst(dataArr,'x')(findingArr),[{"x":5,"y":6}])
        })

        test("Either/disjunction examples for handling errors",function(){
          const findColor = name => 
            ty.Either(({red:'#ff4444', blue:'#3b5998', yellow: '#fff68f'})[name])
              ("No matcing colour found")
                
          const result1 = findColor('green')
                            .map(c => c.slice(1))
                            .fold(
                              func.id,
                              c => c.toUpperCase()
                            );

          const result2 = findColor('red')
                            .map(c => c.slice(1))
                            .fold(
                              func.id,
                              c => c.toUpperCase()
                            );

          assert.equal(result1,'No matcing colour found')
          assert.equal(result2,'FF4444')

        })

        test("Either Conditoin function example for handling errors",function(){
          const eitherLeft = func.eitherCond(false)("Left for false")("result")

          const eitherRight = func.eitherCond(true)("Left for false")("result")

          assert.equal(eitherLeft.inspect(),'Left(Left for false)')
          assert.equal(eitherRight.inspect(),'Right("result")')

        })

        test("Either Monoid example usage for combining results of multiple functions returning Either", function(){
          //EitherMonoid For Type Either[Array[String], Integer]
          //(leftAppend, rightAppend) => (leftUnit, rightUnit)
          const eitherMonoid = dTypes.EitherMonoid(
            (l1,l2) => l1.fold(v1 => l2.fold(v2 => ty.Left([...v1,...v2]))),
            (r1,r2) => r1.fmap(v1 => r2.fmap(v2 => ty.Right(v1 + v2)))
            )([],0);

          const e1 = ty.Left(["Some message1"]);
          const e2 = ty.Left(["Some message2"]);
          const e3 = ty.Right(2);
          const e4 = ty.Right(4);

          //appending two either which are left for given type
          const result1 = eitherMonoid.append(e1,e2)()
          assert.deepEqual(func.fst(result1).fold(func.id), ["Some message1","Some message2"])
          assert.equal(func.snd(result1).fmap(func.id), 0)

          //appending two either one left and one right for given type
          const result2 = eitherMonoid.append(e1,e3)()
          assert.deepEqual(func.fst(result2).fold(func.id), ["Some message1"])
          assert.equal(func.snd(result2).fmap(func.id), 2)

          //appending two either one right and one left for given types
          const result3 = eitherMonoid.append(e3,e1)()
          assert.deepEqual(func.fst(result3).fold(func.id), ["Some message1"])
          assert.equal(func.snd(result3).fmap(func.id), 2)

          //appending two either which are right for given type
          const result4 = eitherMonoid.append(e3,e4)()
          assert.deepEqual(func.fst(result4).fold(func.id), [])
          assert.equal(func.snd(result4).fmap(func.id), 6)
        })

        test("Usage of List monad", function(){
          const invalidList = ty.ListM(undefined)
                                .map(x => 2 * x);
          
          const emptyList = ty.ListM([])
                              .map(x => 2 * x);
          
          const simpleList = ty.ListM([1,2,3])
                                .map(x => 2 * x);

          const nestedList = ty.ListM([[1,2],[3,4],[5,6]])
                                .fmap(y => y.map(x => 2 * x))
                                .map(x => x - 1);

          assert.deepEqual(invalidList.inspect(),ty.EmptyList.inspect())
          assert.deepEqual(emptyList.inspect(),ty.EmptyList.inspect())
          assert.deepEqual(simpleList.inspect(),'List([2,4,6])')
          assert.deepEqual(nestedList.inspect(),'List([1,3,5,7,9,11])')
        })

    });
