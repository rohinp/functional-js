const _$ = (function(){
  //TODO can move to npm module, once matured enough, will make open for other to use

  const id = x => x;
  const compose = (f, g) => input => g(f(input));

  const Some = x => ({
      map: f => Some(f(x)),
      fmap: f => f(x),
      fold: (_, f) => f(x),
      isNone: false,
      inspect: _ => `Some(${x})`
  });

  const None = {
      map: _ => None,
      fmap: _ => None,
      fold: (ifEmpty, _) => ifEmpty(),
      isNone: true,
      inspect: _ => "None"
  };

  const Option = x => (x === undefined || x === null) ? None : Some(x);
  const Either = right => left => Option(right)
                                  .fold(
                                    _ => Left(left),
                                    _ => Right(right)
                                  );

  const eitherCond = condition => left => right =>
    condition ? Right(right) : Left(left)

  const checkListOfOptions = listOpts => Option(listOpts).fold(
      _ => false,
      l => l.filter(x => !x.isNone).length === listOpts.length
  );

  const Left = x => ({
    map: _ => Left(x),
    fmap: _ => Left(x),
    fold: (l,r) => l(x),
    inspect: _ => `Left(${x})`,
    isLeft: true //avoid using this function, makes the code imperative
  });

  const Right = x => ({
      map: f => Right(f(x)),
      fmap: f => f(x),
      fold: (l,r) => r(x),
      inspect: _ => `Right(${JSON.stringify(x)})`,
      isLeft: false //avoid using this function, makes the code imperative
  });

  const head = arr => { let [h, _] = arr; return h };
  const tail = arr => { let [_, ...t] = arr; return t };

  const headO = arr => isEmpty(arr) ? None : Some(head(arr));
  const tailO = arr => isEmpty(arr) ? None : Some(tail(arr));

  const parseIntO = str => {
    const data = parseInt(str);
    return isNaN(data) ? ty.None : ty.Some(data);
  };

  const tuple = (x, y) => [x, y];
  const fst = t => head(t);
  const snd = compose(tail, head);

  const booleanPatternMatching = listOfTupleConditoins => ({
    match: (c1,c2) => snd(head(listOfTupleConditoins.filter(elem => {
      const [[cond1 , cond2], _]  = elem;
      return (cond1 === c1) && (cond2 === c2);
    })))
  });

  const EitherMonoid = (leftAppend, rightAppend) => (leftUnit, rightUnit) =>  ({
    append: (e1, e2) => booleanPatternMatching(
      [
        tuple(tuple(true,true),_ => tuple(leftAppend(e1,e2), Right(rightUnit))),
        tuple(tuple(true,false),_ => tuple(e1,e2)),
        tuple(tuple(false,true),_ => tuple(e2,e1)),
        tuple(tuple(false,false),_ => tuple(Left(leftUnit), rightAppend(e1,e2)))
      ]
    ).match(e1.isLeft,e2.isLeft)
  });

  const isEmpty = arr => arr.length === 0;
  const nonEmptyList = arr => isEmpty(arr) ? None : Some(arr);

  const matchFirst = (dataArr, dKey) => (findingArr, acc = []) => {
      return isEmpty(findingArr) || !isEmpty(acc) ? acc :
          Option(_.find(dataArr, [dKey, head(findingArr)]))
              .fold(
                  _ => matchFirst(dataArr, dKey)(tail(findingArr), []),
                  o => matchFirst(dataArr, dKey)(findingArr, [o])
              );
  };

  const ListM = arr =>
    Option(arr).fold(_ => false, _ => true) && Array.isArray(arr) && arr.length > 0 ? List(arr):EmptyList

  const List = arr => {
    const flattern = arrOfArr => {
      const reducer = (acc,value) => {
        return Array.isArray(value) ? [...acc, ...value] : [...acc, value];
      }
      return arrOfArr.reduce(reducer,[])
    }
    return {
      map: f => List(arr.map(f)),
      fmap: f => List(flattern(arr.map(f))),
      fold: (_, f) => f(arr),
      isEmpty: false,
      inspect: _ => `List(${JSON.stringify(arr)})`
    }
  };

  const EmptyList = ({
    map: _ => EmptyList,
    fmap: _ => EmptyList,
    fold: (ifEmpty, _) => ifEmpty(),
    isEmpty: true,
    inspect: _ => "EmptyList"
  });

  return {
    types: {
      Option,
      Some,
      None,
      tuple,
      Either,
      Left,
      Right,
      ListM,
      List,
      EmptyList
    },
    derivedTypes: {
      EitherMonoid
    },
    func:{
      id,
      compose,
      fst,
      snd,
      parseIntO,
      eitherCond
    },
    arr:{
      headO,
      tailO,
      head,
      tail,
      isEmpty,
      nonEmptyList,
      checkListOfOptions,
      matchFirst
    }
  };
})();
